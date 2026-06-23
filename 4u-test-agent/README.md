# 4uTest MCP Agent

A lightweight Docker container that gives Claude Code direct access to your server — files, system metrics, and your latest 4uTest audit results — via the Model Context Protocol (MCP).

## What it does

Once deployed on your server, Claude Code can:

- **Read and edit files** on your server — no manual copy-paste
- **Check real-time server health** — CPU, RAM, disk usage
- **Access your latest 4uTest audit** — health score, broken links, missing headers, SEO issues
- **Create automatic backups** before making any changes
- **Run a download speed test** against your server's internet connection

The audit results are synced automatically from the 4uTest platform every time a scan completes on your linked site.

---

## Quick start

### 1. Register an agent in 4uTest

Log in to your 4uTest dashboard → **MCP Agent** → **Register Agent**. Link it to one of your monitored sites. Copy the token shown.

### 2. SSH into your server

```bash
ssh user@your-server-ip
```

### 3. Install Docker (if not already installed)

```bash
curl -fsSL https://get.docker.com | sh
```

### 4. Clone the agent

```bash
git clone https://github.com/gveloper-m/4U-check.git /opt/4utest-agent
cd /opt/4utest-agent/4u-test-agent
cp .env.example .env
nano .env
```

### 5. Configure `.env`

```env
AGENT_TOKEN=paste-your-token-from-dashboard
FOURTEST_API_URL=https://4utest.io
MCP_SERVER_PORT=8765
MAX_BACKUPS=10
```

Edit `docker-compose.yml` — change the left side of the workspace volume to your project directory:

```yaml
volumes:
  - /var/www/your-actual-project:/workspace   # <-- change this
  - ./backups:/backups
```

### 6. Start the agent

```bash
docker compose up -d --build
docker compose logs -f   # wait for "Heartbeat OK"
```

The agent will appear as **Online** in your 4uTest dashboard within 60 seconds.

---

## Connect Claude Code

### Option A — SSH tunnel (recommended, most secure)

On your **local machine**, open a tunnel:

```bash
ssh -L 8765:localhost:8765 user@your-server-ip -N &
```

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "4utest-agent": {
      "url": "http://localhost:8765/sse"
    }
  }
}
```

### Option B — Direct port (if firewall allows)

Open port 8765 in your firewall and use the server IP directly:

```json
{
  "mcpServers": {
    "4utest-agent": {
      "url": "http://your-server-ip:8765/sse"
    }
  }
}
```

Restart Claude Code. You will see **4uTest Agent** in the MCP servers list.

---

## Available MCP tools

| Tool | Description |
|---|---|
| `get_system_metrics` | CPU, RAM, disk, network stats |
| `run_speed_test` | Download speed from Cloudflare |
| `list_directory` | List files in workspace |
| `read_file` | Read a workspace file |
| `write_file` | Write or create a workspace file |
| `get_file_info` | File metadata / permissions |
| `search_files` | Glob search in workspace |
| `create_session_backup` | ZIP workspace → /backups right now |
| `list_backups` | Show all available backups |
| `get_audit_report` | Latest 4uTest audit results for the linked site |

---

## Typical workflow

```
1. Run a 4uTest scan on your site
2. Click "Push Latest Scan" in the 4uTest dashboard
3. Open Claude Code — the audit results are ready
4. Tell Claude: "Check the latest 4uTest audit and fix the top issues"
5. Claude creates a backup, reads the audit, edits the files, done
```

---

## Configuration reference

| Variable | Default | Description |
|---|---|---|
| `AGENT_TOKEN` | — | Token from 4uTest dashboard (**required**) |
| `FOURTEST_API_URL` | `https://4utest.io` | 4uTest platform URL |
| `MCP_SERVER_PORT` | `8765` | Port the SSE server listens on |
| `MAX_BACKUPS` | `10` | Number of ZIP snapshots to keep |
| `BACKUP_HOUR` | `2` | UTC hour for daily scheduled backup |
| `BACKUP_MINUTE` | `0` | Minute for daily scheduled backup |
| `HEARTBEAT_INTERVAL` | `60` | Seconds between heartbeats |

---

## Volumes

| Mount | Purpose |
|---|---|
| `/workspace` | Project directory Claude reads/edits — map to your actual project |
| `/backups` | ZIP snapshots — safe to back up to S3 or similar |

---

## Security notes

- Files writes are sandboxed to `/workspace` — Claude cannot escape this directory
- The agent token is the only authentication mechanism — keep it secret
- Use SSH tunnel (Option A) to avoid exposing port 8765 to the public internet
- Backups are stored locally — add an offsite copy for production use
