# 4utest REST API

The 4utest API lets paid users run website audits, retrieve results, and download reports programmatically. Every action counts against the same monthly scan quota as the web app — there is no separate API allowance.

**Base URL:** `https://4utest.com/api/v1`

---

## Authentication

All requests must include your API key as a Bearer token in the `Authorization` header:

```
Authorization: Bearer 4ut_your_api_key_here
```

Generate and manage keys at **Account → Profile → API Keys**. You can have up to 5 active keys per account.

| Status | Meaning |
|--------|---------|
| `401 Unauthorized` | Missing or invalid key |
| `403 Forbidden` | Key is valid but account has no active subscription |
| `429 Too Many Requests` | Rate limit (60 requests/minute) or monthly scan quota reached |

---

## Endpoints

### GET /me

Returns your account info and current usage.

**Request**
```bash
curl -H "Authorization: Bearer 4ut_..." https://4utest.com/api/v1/me
```

**Response `200`**
```json
{
  "id": 42,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "company_name": "Acme Ltd",
  "plan": {
    "active": true,
    "is_unlimited": false,
    "on_trial": false,
    "trial_days_left": 0
  },
  "usage": {
    "scans_this_month": 8,
    "monthly_limit": 30,
    "remaining": 22
  }
}
```

---

### GET /sites

Lists your monitored sites.

**Request**
```bash
curl -H "Authorization: Bearer 4ut_..." https://4utest.com/api/v1/sites
```

**Response `200`**
```json
{
  "data": [
    {
      "id": 3,
      "url": "https://example.com",
      "label": "My Shop",
      "is_primary": true
    }
  ]
}
```

---

### GET /scans

Returns your scan history, newest first. Paginated at 20 per page.

**Request**
```bash
curl -H "Authorization: Bearer 4ut_..." "https://4utest.com/api/v1/scans?page=1"
```

**Response `200`**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 127,
      "url": "https://example.com",
      "name": "My Shop",
      "status": "completed",
      "health_score": 72,
      "created_at": "2026-07-06T10:30:00+00:00"
    }
  ],
  "last_page": 4,
  "per_page": 20,
  "total": 74
}
```

**Scan statuses:** `running` → `completed` or `failed`

---

### POST /scans

Triggers a full 7-module audit on a URL. Deducts 1 from your monthly quota.

**Request**
```bash
curl -X POST \
  -H "Authorization: Bearer 4ut_..." \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "name": "My Shop"}' \
  https://4utest.com/api/v1/scans
```

**Body parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | yes | Full URL including protocol |
| `name` | string | no | Label for the scan (defaults to the URL) |

**Response `202 Accepted`**
```json
{
  "id": 171,
  "status": "running",
  "url": "https://example.com"
}
```

The scan runs asynchronously. Poll `GET /scans/{id}` until `status` is `completed`.

**Response `429`** when the monthly quota is reached:
```json
{ "error": "Monthly scan limit reached." }
```

---

### GET /scans/{id}

Returns the full results of a scan, including all 7 audit modules.

**Request**
```bash
curl -H "Authorization: Bearer 4ut_..." https://4utest.com/api/v1/scans/127
```

**Response `200`**
```json
{
  "id": 127,
  "url": "https://example.com",
  "name": "My Shop",
  "status": "completed",
  "health_score": 72,
  "created_at": "2026-07-06T10:30:00+00:00",
  "results": {
    "seo_schema":       { ... },
    "security":         { ... },
    "catalog":          { ... },
    "tracking":         { ... },
    "broken_resources": { ... },
    "performance":      { ... },
    "accessibility":    { ... }
  }
}
```

**Response `404`** if the scan doesn't exist or belongs to another account.

---

### GET /scans/{id}/pdf

Downloads the audit report as a PDF (same document as the in-app export). Only available for completed scans.

**Request**
```bash
curl -H "Authorization: Bearer 4ut_..." \
  https://4utest.com/api/v1/scans/127/pdf \
  -o report.pdf
```

**Response `200 application/pdf`** — binary PDF file download.

**Response `409`** if the scan is still running:
```json
{ "error": "Scan not yet completed." }
```

---

### GET /scans/{id}/csv

Downloads all audit data as CSV (module, key, value rows). Only available for completed scans.

**Request**
```bash
curl -H "Authorization: Bearer 4ut_..." \
  https://4utest.com/api/v1/scans/127/csv \
  -o report.csv
```

**Response `200 text/csv`** — CSV file with columns: `module`, `key`, `value`.

---

## Polling pattern

Scans take several minutes to complete. The recommended pattern:

```bash
# 1. Trigger
SCAN=$(curl -s -X POST \
  -H "Authorization: Bearer 4ut_..." \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' \
  https://4utest.com/api/v1/scans)

ID=$(echo $SCAN | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# 2. Poll until done
while true; do
  STATUS=$(curl -s -H "Authorization: Bearer 4ut_..." \
    https://4utest.com/api/v1/scans/$ID | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
  echo "Status: $STATUS"
  [ "$STATUS" = "completed" ] && break
  sleep 30
done

# 3. Download PDF
curl -H "Authorization: Bearer 4ut_..." \
  https://4utest.com/api/v1/scans/$ID/pdf -o report.pdf
```

---

## Rate limits

- **60 requests per minute** per API key
- **Monthly scan quota** is shared with the web app (30 scans/site/month by default)

---

## Error responses

All errors return JSON:

```json
{ "error": "Human-readable message." }
```

| Code | Meaning |
|------|---------|
| `401` | Invalid or missing API key |
| `403` | No active subscription |
| `404` | Scan not found (or belongs to another account) |
| `409` | Scan not completed yet (for PDF/CSV) |
| `422` | Validation error (invalid URL etc.) |
| `429` | Rate limit or monthly quota exceeded |
| `500` | Server error |

---

## Managing API keys

Keys are managed from your profile page at `https://4utest.com/profile`.

- Maximum **5 keys** per account
- Each key is shown **once** at creation — copy it immediately
- Keys can be revoked at any time; revocation is immediate
- `last_used_at` is updated on every authenticated request
