# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Compile server.py to a native binary via Nuitka
#
# The output is a self-contained agent.dist/ directory of compiled C extensions.
# No Python source code, no .py files, no interpreter in the final image.
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc g++ patchelf ccache binutils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir "nuitka>=2.4" ordered-set zstandard

COPY server.py .

RUN python -m nuitka \
        --standalone \
        --output-dir=dist \
        --output-filename=agent \
        --include-package=mcp \
        --include-package=uvicorn \
        --include-package=starlette \
        --include-package=anyio \
        --include-package=httpcore \
        --include-package=sniffio \
        --include-package=httpx \
        --include-package=psutil \
        --include-package=apscheduler \
        --include-package=dotenv \
        --include-package=click \
        --include-package=h11 \
        --include-package-data=mcp \
        --include-package-data=uvicorn \
        --include-package-data=starlette \
        --nofollow-import-to=tkinter,test,unittest \
        server.py

# Strip debug symbols from the main binary
RUN strip --strip-all dist/agent.dist/agent 2>/dev/null || true

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Minimal runtime image
#
# No Python interpreter. No source code. Only the compiled binary + system libs.
# ─────────────────────────────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl zip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /build/dist/agent.dist/ .

RUN mkdir -p /workspace /backups

EXPOSE 8765

CMD ["./agent"]
