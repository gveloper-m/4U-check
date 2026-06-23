FROM python:3.11-slim

LABEL maintainer="4uTest Agent"
LABEL description="4uTest MCP Agent — filesystem bridge, diagnostics, and audit data sync"

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    zip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

RUN mkdir -p /workspace /backups

EXPOSE 8765

CMD ["python", "server.py"]
