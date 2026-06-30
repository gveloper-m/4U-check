"""
4uTest MCP Agent Server
-----------------------
Exposes your server to Claude Code via the Model Context Protocol (MCP).

Tools available to Claude:
  - get_system_metrics      CPU / RAM / disk stats
  - run_speed_test          Download speed from CDN
  - list_directory          List files inside workspace
  - read_file               Read a workspace file
  - write_file              Write/create a workspace file
  - get_file_info           Stat a workspace file
  - search_files            Glob-search workspace
  - create_session_backup   Zip workspace → /backups right now
  - get_audit_report        Latest 4uTest scan results for the linked site
"""

import os
import sys
import json
import shutil
import zipfile
import threading
import time
import glob as glob_module
from datetime import datetime
from pathlib import Path

import psutil
import httpx
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv

load_dotenv()

# ── Configuration ─────────────────────────────────────────────────────────────
WORKSPACE     = Path(os.getenv("WORKSPACE_PATH", "/workspace")).resolve()
BACKUPS_DIR   = Path(os.getenv("BACKUPS_PATH", "/backups")).resolve()
DATA_DIR      = WORKSPACE / ".4utest"          # audit reports land here
MAX_BACKUPS   = int(os.getenv("MAX_BACKUPS", "10"))
PORT          = int(os.getenv("MCP_SERVER_PORT", "8765"))
AGENT_TOKEN   = os.getenv("AGENT_TOKEN", "")
API_BASE      = os.getenv("API_BASE", "https://4utest.com")
HB_INTERVAL   = int(os.getenv("HEARTBEAT_INTERVAL", "60"))
BACKUP_HOUR   = int(os.getenv("BACKUP_HOUR", "2"))
BACKUP_MINUTE = int(os.getenv("BACKUP_MINUTE", "0"))

WORKSPACE.mkdir(parents=True, exist_ok=True)
BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ── FastMCP ───────────────────────────────────────────────────────────────────
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    name="4uTest Agent",
    instructions=(
        "You are connected to a 4uTest Agent running on a live server. "
        "You can inspect the filesystem, read server health metrics, view the "
        "latest website audit report from 4uTest, and create backups before "
        "making changes. Always call create_session_backup before editing files."
    ),
)


# ── Path safety ───────────────────────────────────────────────────────────────
def _safe(path: str) -> Path:
    """Resolve path and ensure it stays inside WORKSPACE."""
    resolved = (WORKSPACE / path).resolve()
    if not str(resolved).startswith(str(WORKSPACE)):
        raise PermissionError(f"'{path}' is outside the allowed workspace ({WORKSPACE})")
    return resolved


# ── Tools ─────────────────────────────────────────────────────────────────────

@mcp.tool()
def get_system_metrics() -> dict:
    """
    Return current CPU, RAM, and disk usage for the host server.
    Use this to understand server load before running heavy tasks.
    """
    cpu    = psutil.cpu_percent(interval=1)
    ram    = psutil.virtual_memory()
    disk   = psutil.disk_usage("/")
    net    = psutil.net_io_counters()

    return {
        "cpu": {
            "usage_percent": cpu,
            "logical_cores": psutil.cpu_count(logical=True),
            "physical_cores": psutil.cpu_count(logical=False),
        },
        "ram": {
            "total_gb":     round(ram.total / 1e9, 2),
            "used_gb":      round(ram.used  / 1e9, 2),
            "available_gb": round(ram.available / 1e9, 2),
            "usage_percent": ram.percent,
        },
        "disk": {
            "total_gb": round(disk.total / 1e9, 2),
            "used_gb":  round(disk.used  / 1e9, 2),
            "free_gb":  round(disk.free  / 1e9, 2),
            "usage_percent": disk.percent,
        },
        "network": {
            "bytes_sent_mb": round(net.bytes_sent / 1e6, 2),
            "bytes_recv_mb": round(net.bytes_recv / 1e6, 2),
        },
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@mcp.tool()
def run_speed_test() -> dict:
    """
    Measure the server's outbound download speed by timing a 10 MB fetch
    from Cloudflare's speed test endpoint.
    """
    url  = "https://speed.cloudflare.com/__down?bytes=10000000"
    try:
        start = time.perf_counter()
        with httpx.stream("GET", url, timeout=30, follow_redirects=True) as r:
            total = sum(len(chunk) for chunk in r.iter_bytes(chunk_size=65536))
        elapsed = time.perf_counter() - start
        mbps = (total * 8) / elapsed / 1e6
        return {
            "download_mbps":  round(mbps, 2),
            "bytes_received": total,
            "elapsed_seconds": round(elapsed, 3),
            "status": "ok",
        }
    except Exception as exc:
        return {"status": "error", "error": str(exc)}


@mcp.tool()
def list_directory(path: str = ".") -> dict:
    """
    List files and subdirectories inside the workspace.
    `path` is relative to the workspace root (default: workspace root).
    """
    target = _safe(path)
    if not target.exists():
        raise FileNotFoundError(f"'{path}' does not exist")
    if not target.is_dir():
        raise NotADirectoryError(f"'{path}' is not a directory")

    entries = []
    for item in sorted(target.iterdir()):
        stat = item.stat()
        entries.append({
            "name":         item.name,
            "type":         "dir" if item.is_dir() else "file",
            "size_bytes":   stat.st_size if item.is_file() else None,
            "modified_at":  datetime.utcfromtimestamp(stat.st_mtime).isoformat() + "Z",
        })

    return {"path": str(target.relative_to(WORKSPACE)), "entries": entries}


@mcp.tool()
def read_file(path: str) -> dict:
    """
    Read a file inside the workspace. Returns the text content.
    `path` is relative to the workspace root.
    """
    target = _safe(path)
    if not target.exists():
        raise FileNotFoundError(f"'{path}' does not exist")
    if not target.is_file():
        raise IsADirectoryError(f"'{path}' is a directory, not a file")

    size = target.stat().st_size
    if size > 5 * 1024 * 1024:  # 5 MB guard
        raise ValueError(f"File is {size} bytes — too large to read (5 MB limit)")

    try:
        content = target.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return {"path": path, "encoding": "binary", "content": None,
                "note": "Binary file — cannot display as text"}

    return {
        "path":    path,
        "size":    size,
        "content": content,
    }


@mcp.tool()
def write_file(path: str, content: str, create_dirs: bool = False) -> dict:
    """
    Write text content to a file inside the workspace.
    Set create_dirs=true to create parent directories automatically.
    `path` is relative to the workspace root.
    """
    target = _safe(path)

    if create_dirs:
        target.parent.mkdir(parents=True, exist_ok=True)
    elif not target.parent.exists():
        raise FileNotFoundError(f"Parent directory '{target.parent.relative_to(WORKSPACE)}' does not exist. Set create_dirs=true to create it.")

    target.write_text(content, encoding="utf-8")
    return {
        "path":          path,
        "bytes_written": len(content.encode("utf-8")),
        "status":        "ok",
    }


@mcp.tool()
def get_file_info(path: str) -> dict:
    """
    Return metadata for a file or directory inside the workspace.
    `path` is relative to the workspace root.
    """
    target = _safe(path)
    if not target.exists():
        raise FileNotFoundError(f"'{path}' does not exist")

    stat = target.stat()
    return {
        "path":         path,
        "type":         "dir" if target.is_dir() else "file",
        "size_bytes":   stat.st_size,
        "created_at":   datetime.utcfromtimestamp(stat.st_ctime).isoformat() + "Z",
        "modified_at":  datetime.utcfromtimestamp(stat.st_mtime).isoformat() + "Z",
        "is_readable":  os.access(target, os.R_OK),
        "is_writable":  os.access(target, os.W_OK),
    }


@mcp.tool()
def search_files(pattern: str, path: str = ".") -> dict:
    """
    Search for files matching a glob pattern inside the workspace.
    Examples: pattern="**/*.php", path="src"
    """
    base = _safe(path)
    matched = []
    for p in base.glob(pattern):
        try:
            rel = str(p.relative_to(WORKSPACE))
            matched.append({
                "path": rel,
                "type": "dir" if p.is_dir() else "file",
                "size_bytes": p.stat().st_size if p.is_file() else None,
            })
        except Exception:
            pass

    return {"pattern": pattern, "base": str(base.relative_to(WORKSPACE)), "matches": matched, "count": len(matched)}


@mcp.tool()
def create_session_backup(label: str = "") -> dict:
    """
    Create an immediate ZIP snapshot of the entire workspace into /backups.
    Call this before making any code changes so you can roll back if needed.
    Older backups are auto-rotated to keep only MAX_BACKUPS snapshots.
    """
    return _do_backup(label=label or "session")


@mcp.tool()
def get_audit_report() -> dict:
    """
    Return the latest 4uTest audit report for the site linked to this agent.
    The report is auto-synced from the 4uTest platform after every scan.
    Use this to understand what issues exist on the site before making fixes.
    """
    report_file = DATA_DIR / "latest-report.json"
    if not report_file.exists():
        return {
            "status": "no_data",
            "message": "No audit report synced yet. Run a scan in 4uTest and click 'Push to Agent', or wait for the next heartbeat sync.",
        }

    try:
        data = json.loads(report_file.read_text(encoding="utf-8"))
        return {"status": "ok", "report": data}
    except Exception as exc:
        return {"status": "error", "error": str(exc)}


@mcp.tool()
def list_backups() -> dict:
    """List all available workspace backups sorted by creation date (newest first)."""
    backups = sorted(BACKUPS_DIR.glob("*.zip"), key=lambda p: p.stat().st_mtime, reverse=True)
    return {
        "backups": [
            {
                "name":        b.name,
                "size_mb":     round(b.stat().st_size / 1e6, 2),
                "created_at":  datetime.utcfromtimestamp(b.stat().st_mtime).isoformat() + "Z",
            }
            for b in backups
        ],
        "count":       len(backups),
        "max_backups": MAX_BACKUPS,
    }


# ── Backup helpers ────────────────────────────────────────────────────────────

def _do_backup(label: str = "scheduled") -> dict:
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_label = "".join(c if c.isalnum() or c in "-_" else "_" for c in label)[:30]
    zip_name   = f"backup_{timestamp}_{safe_label}.zip"
    zip_path   = BACKUPS_DIR / zip_name

    try:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for item in WORKSPACE.rglob("*"):
                # skip the .4utest data dir from backups
                if item.is_file() and DATA_DIR not in item.parents:
                    try:
                        zf.write(item, item.relative_to(WORKSPACE))
                    except (PermissionError, OSError):
                        pass

        size_mb = round(zip_path.stat().st_size / 1e6, 2)
        _rotate_backups()

        return {
            "status":   "ok",
            "backup":   zip_name,
            "size_mb":  size_mb,
            "path":     str(zip_path),
        }
    except Exception as exc:
        return {"status": "error", "error": str(exc)}


def _rotate_backups():
    backups = sorted(BACKUPS_DIR.glob("*.zip"), key=lambda p: p.stat().st_mtime)
    while len(backups) > MAX_BACKUPS:
        oldest = backups.pop(0)
        try:
            oldest.unlink()
        except OSError:
            pass


# ── Heartbeat (background thread) ────────────────────────────────────────────

def _heartbeat_loop():
    """
    Every HB_INTERVAL seconds:
      1. Collect system metrics
      2. POST to 4uTest /api/agent/heartbeat with Bearer token
      3. If response contains latest_report_json, save it to /workspace/.4utest/latest-report.json
    """
    if not AGENT_TOKEN:
        print("[heartbeat] AGENT_TOKEN not set — heartbeat disabled", flush=True)
        return

    while True:
        try:
            metrics = {
                "cpu_percent":  psutil.cpu_percent(interval=0.5),
                "ram_percent":  psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage("/").percent,
            }
            resp = httpx.post(
                f"{API_BASE}/api/agent/heartbeat",
                headers={"Authorization": f"Bearer {AGENT_TOKEN}",
                         "Accept": "application/json",
                         "Content-Type": "application/json"},
                json={"metrics": metrics},
                timeout=15,
            )
            if resp.status_code == 200:
                payload = resp.json()
                report_json = payload.get("latest_report_json")
                if report_json:
                    (DATA_DIR / "latest-report.json").write_text(
                        json.dumps(report_json, indent=2, ensure_ascii=False),
                        encoding="utf-8",
                    )
                    print(f"[heartbeat] Audit report synced at {datetime.utcnow().isoformat()}Z", flush=True)
                print(f"[heartbeat] OK — CPU {metrics['cpu_percent']}% RAM {metrics['ram_percent']}%", flush=True)
            else:
                print(f"[heartbeat] HTTP {resp.status_code}: {resp.text[:200]}", flush=True)
        except Exception as exc:
            print(f"[heartbeat] Error: {exc}", flush=True)

        time.sleep(HB_INTERVAL)


# ── Scheduler (daily backup) ──────────────────────────────────────────────────

def _start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        lambda: _do_backup("daily"),
        CronTrigger(hour=BACKUP_HOUR, minute=BACKUP_MINUTE),
        id="daily_backup",
        replace_existing=True,
    )
    scheduler.start()
    print(f"[scheduler] Daily backup scheduled at {BACKUP_HOUR:02d}:{BACKUP_MINUTE:02d} UTC", flush=True)
    return scheduler


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"[agent] Workspace : {WORKSPACE}", flush=True)
    print(f"[agent] Backups   : {BACKUPS_DIR}", flush=True)
    print(f"[agent] API base  : {API_BASE}", flush=True)
    print(f"[agent] Port      : {PORT}", flush=True)

    # Start heartbeat thread
    hb_thread = threading.Thread(target=_heartbeat_loop, daemon=True)
    hb_thread.start()

    # Start daily backup scheduler
    _start_scheduler()

    # Run MCP server with SSE transport
    mcp.run(transport="sse", host="0.0.0.0", port=PORT)
