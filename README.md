# 4uTest — Website Audit Platform

4uTest is a subscription SaaS platform that automatically audits websites across seven dimensions and tells you exactly what is wrong with them. You paste a URL, the platform runs seven analysis modules in parallel, and within about 30 seconds you have a full health report — a score out of 100, a precise list of every issue, what it costs you in points, and why it matters.

Built for digital agencies, e-commerce businesses, and anyone who needs to monitor multiple websites on a recurring schedule without paying a consultant to manually check things every month.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Feature Overview](#feature-overview)
3. [The 7 Audit Modules](#the-7-audit-modules)
4. [Health Score](#health-score)
5. [Scheduled Scans](#scheduled-scans)
6. [Scan History & Comparison](#scan-history--comparison)
7. [Monitored Sites & Billing](#monitored-sites--billing)
8. [White-Label Sharing](#white-label-sharing)
9. [Agency Branding](#agency-branding)
10. [MCP Agent](#mcp-agent)
11. [Support Tickets](#support-tickets)
12. [Blog](#blog)
13. [Multi-Language Support](#multi-language-support)
14. [Admin Panel](#admin-panel)
15. [Security Architecture](#security-architecture)
16. [API Endpoints](#api-endpoints)
17. [Queue & Scheduler](#queue--scheduler)
18. [Email System](#email-system)
19. [Production: Step-by-Step](#production-step-by-step)
20. [Useful Commands](#useful-commands)

---

## Tech Stack

### Backend
| Component | Version | Purpose |
|---|---|---|
| **Laravel** | 13.x | Full-stack PHP framework — routing, ORM, queues, mail, auth |
| **PHP** | 8.3 | Runtime |
| **MySQL** | 8.4 | Primary relational database |
| **Redis** | 7 (Alpine) | Cache store and queue backend |
| **Laravel Horizon** | 5.47 | Queue worker management and monitoring dashboard |
| **Laravel Cashier** | 16.5 | Stripe subscription and billing integration |
| **Laravel Sanctum** | 4.0 | Token-based API authentication |
| **Laravel Breeze** | 2.4 | Authentication scaffolding (login, register, password reset, email verify) |
| **DomPDF** | 3.1 | PDF generation from Blade templates |
| **Browsershot / Puppeteer** | 5.4 | Headless Chromium control for Core Web Vitals measurement |
| **phpseclib** | 3.0 | Pure-PHP SSH client (used for MCP Agent auto-deploy) |
| **Symfony DomCrawler** | 8.1 | HTML/DOM parsing during audits |
| **Ziggy** | 2.0 | Exposes Laravel named routes to JavaScript |

### Frontend
| Component | Version | Purpose |
|---|---|---|
| **React** | 18.2 | UI framework |
| **TypeScript** | 5.0 | Type-safe JavaScript |
| **Vite** | 8.0 | Build tool and dev server |
| **Inertia.js** | 2.0 | Glues React to Laravel — no separate API, no client-side routing setup |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework |
| **Headless UI** | 2.0 | Accessible, unstyled UI components |
| **Lucide React** | 0.468 | SVG icon library |
| **Recharts** | 2.10 | React charting library (admin dashboards) |
| **TipTap** | 3.26 | Headless rich-text editor (blog post editor) |
| **Axios** | 1.17 | HTTP client for frontend API calls |
| **i18next** | 26.3 | Internationalisation framework |
| **react-i18next** | 17.0 | React bindings for i18next |
| **i18next-browser-languagedetector** | 8.2 | Auto-detects user language from browser |

### MCP Agent (Python)
| Component | Purpose |
|---|---|
| **FastMCP** | Anthropic's Model Context Protocol server — exposes tools to Claude Code |
| **psutil** | System metrics: CPU, RAM, disk, network |
| **httpx** | Async HTTP client for heartbeat and API calls |
| **APScheduler** | Background task scheduling (daily backups) |
| **python-dotenv** | Environment variable loading |

### Infrastructure
| Component | Purpose |
|---|---|
| **Docker + Compose** | All services containerised for production |
| **Nginx** | Reverse proxy, SSL termination |
| **Certbot** | Automatic Let's Encrypt certificate provisioning and renewal |
| **GitHub Actions** | CI/CD — auto-builds and publishes the MCP Agent Docker image |

---

## Feature Overview

- Seven-module parallel website audits with a scored health report
- Scheduled scans (hourly / daily / weekly / monthly) with email + PDF delivery
- Full scan history, side-by-side comparison of up to 3 scans, PDF and CSV export
- Per-site monitored site registry with billing integration for extra sites
- White-label public share links — no 4uTest branding, no login required
- Agency branding — custom logo, colours, footer text on all exports and shared reports
- MCP Agent — deploy a Docker container on your server; Claude Code gets live file access, server metrics, and audit results
- Built-in support ticket system with threaded messages and file attachments
- Public blog with AI-powered draft generation (Mistral)
- Full interface, emails, and PDFs in 7 languages
- Stripe subscription billing with automatic VAT calculation (Stripe Tax)

---

## The 7 Audit Modules

All seven modules are dispatched as independent queue jobs and run in parallel. The report is marked "completed" and the health score is computed only when all seven finish.

---

### 1. SEO & Schema

Checks everything search engines and social platforms need to correctly index and display the page.

| Check | Detail |
|---|---|
| Meta title | Presence; optimal length 30–60 chars; reports too short / too long / missing |
| Meta description | Presence; optimal ~150 chars |
| H1 tags | Optimal: exactly one. Reports missing or multiple |
| Canonical URL | Presence; must match the audited URL |
| Open Graph tags | Checks `og:title`, `og:description`, `og:image`, `og:url`; lists missing |
| JSON-LD structured data | Validates schema markup; reports parse errors |
| Image alt text | Counts images missing `alt` attribute; lists affected URLs |
| robots.txt | Existence check |
| sitemap.xml | Existence check |

**Score deductions:** missing or malformed meta title/description −5 each; H1 issue −5; missing canonical −3; canonical mismatch −5; no structured data −5; missing OG tags −5; images missing alt −5; missing robots.txt −3; missing sitemap −3.

---

### 2. Security

Checks SSL, transport security, HTTP security headers, and DNS email authentication records.

| Check | Detail |
|---|---|
| SSL certificate | Validity, issuer, days to expiry (alerts if ≤ 30 days) |
| HTTPS redirect | Confirms HTTP → HTTPS redirect is in place |
| Mixed content | Detects HTTP assets loaded on an HTTPS page |
| HSTS | `Strict-Transport-Security` header presence |
| CSP | `Content-Security-Policy` header presence |
| X-Frame-Options | Clickjacking protection |
| X-Content-Type-Options | MIME-type sniffing prevention |
| Referrer-Policy | Controls referrer information sent to third parties |
| Permissions-Policy | Controls browser feature access |
| Server disclosure | Detects `Server` and `X-Powered-By` header leaks |
| SPF record | DNS TXT record for email sender authentication |
| DMARC record | DNS TXT record for email policy |

**Score deductions:** invalid / missing SSL −20; SSL expiring ≤ 30 days −10; mixed content −10; no SPF −5; no DMARC −5; most headers missing (≤ 2 present) −10; some headers missing (≤ 4 present) −5; HTTP not redirecting to HTTPS −5.

---

### 3. Performance

Measures server response time, compression, and Core Web Vitals via headless Chromium.

| Check | Detail |
|---|---|
| TTFB | Time to First Byte — raw server response speed |
| Compression | Detects Gzip, Deflate, or Brotli |
| First Contentful Paint (FCP) | Desktop and mobile, via Lighthouse / Puppeteer |
| Largest Contentful Paint (LCP) | Desktop and mobile |
| Cumulative Layout Shift (CLS) | Desktop and mobile |
| Render-blocking scripts | Count and list of blocking `<script>` tags |
| Render-blocking stylesheets | Count and list of blocking `<link rel="stylesheet">` tags |
| Page size | Total HTML size in KB |
| Resource count | Total page resources |

Tests up to 15 internal pages. Maximum budget: 2 minutes.

**Score deductions:** TTFB > 1500 ms −10; TTFB 600–1500 ms −5; compression not enabled −5.

---

### 4. Broken Resources

Crawls all internal links and images and verifies each one returns a working HTTP response.

| Check | Detail |
|---|---|
| Internal links | HTTP response code for each link found on the page |
| Images | HTTP response code for each image source |
| Broken URL details | For each broken URL: the URL, HTTP status code or error, and the source page where it was found |
| Summary stats | Total checked, broken count, broken percentage — separately for links and images |

Crawls up to 60 pages with a 3.5-minute budget.

**Score deductions:** > 10 broken links −10; 1–10 broken links −5 per link; any broken images −5 per image.

---

### 5. E-Commerce Catalog

Detects product pages and validates pricing, stock status, and cart availability.

| Check | Detail |
|---|---|
| Product page detection | Identifies product pages via common URL and DOM patterns |
| Price validation | Checks for price presence and correct formatting |
| Stock status consistency | Compares structured data stock status against visible page copy |
| Add-to-cart availability | Detects disabled or missing add-to-cart buttons |
| Broken products | Detects product pages returning errors |

Audits up to 50 product pages. Per-product report includes URL, price found, schema stock status, cart status, and whether a mismatch was detected.

**Score deductions:** > 50% broken products −20; 10–50% broken −10; 0–10% broken −5.

---

### 6. Marketing & Tracking

Detects tracking and analytics scripts across crawled pages and reports active pixel IDs.

| Tracker | What is captured |
|---|---|
| Google Analytics 4 | Detection + measurement IDs |
| Google Tag Manager | Detection + container IDs |
| Facebook Pixel | Detection + pixel IDs |
| TikTok Pixel | Detection + pixel IDs |
| Google Ads | Conversion tracking detection |
| Hotjar | Detection + site IDs |

Crawls up to 20 pages with a 120-second budget.

**Score deductions:** no GA4 detected −5; no Facebook Pixel −3.

---

### 7. Accessibility (WCAG)

Checks WCAG compliance covering forms, images, ARIA, heading structure, landmarks, and colour contrast.

| Check | Detail |
|---|---|
| Form labels | All inputs must have associated `<label>` elements; counts unlabelled |
| Image alt text | Counts images missing `alt`; lists affected URLs |
| ARIA labels | Validates `aria-label` / `aria-labelledby` on buttons, links, form controls |
| Heading hierarchy | H1 → H2 → H3 nesting without skips |
| Link text | Detects vague link text ("click here", "read more") |
| `<main>` landmark | Presence of main content landmark |
| Skip navigation | Presence of skip-to-content link |
| HTML `lang` attribute | Presence of language declaration |
| Colour contrast | Calculates foreground/background contrast ratios; flags WCAG AA failures (4.5:1) |

**Score deductions:** > 3 unlabelled inputs −8; > 5 images missing alt −5; > 2 ARIA violations −5; heading hierarchy issues −5; missing `lang` attribute −5; no `<main>` landmark −3; > 2 contrast violations −5.

---

## Health Score

Every completed scan produces a score from 0 to 100. Each module starts the session with points; issues deduct from the total. The score is colour-coded: green ≥ 70, amber ≥ 40, red < 40. Every deduction is listed by name, point cost, and module so users know exactly what to fix first.

---

## Scheduled Scans

Users can configure automatic scans on any monitored site — hourly, daily, weekly, or monthly. Each scheduled scan can have:

- **Email notification** — sends the report summary and a full PDF when the scan completes
- **Custom name** — for identifying the scan in history
- **Frequency** — hourly / daily / weekly / monthly
- **Run now** — trigger immediately from the dashboard

The `scans:run` artisan command fires every minute, finds all scans whose `next_run_at` has passed, and dispatches them as queue jobs. `next_run_at` is updated before dispatch to prevent double-run.

---

## Scan History & Comparison

Every audit is saved permanently. Users can:

- Browse the full scan history for any URL
- Filter by date range or score
- Open any past report to see the full breakdown
- Compare two or three scans side-by-side to track improvements
- Export any report as a **PDF** (branded with agency logo and colours if configured)
- Export any report as a **CSV** (full data including all 7 module results and deductions)

---

## Monitored Sites & Billing

### Monitored Sites

Users register the websites they want to track. Each monitored site:

- Has a URL and optional label
- One site is marked as `is_primary` (the base plan site)
- Additional sites are "extra sites" — each one triggers a Stripe subscription add-on

Sites are linked to scheduled scans, MCP agents, and audit history.

### Subscription Plans

| Plan | Price | Billing |
|---|---|---|
| Pro Monthly | €19.99/month | Monthly recurring |
| Pro Yearly | €199.99/year | Yearly recurring (~40% saving) |

### Extra Site Add-Ons

| Add-On | Price | Per |
|---|---|---|
| Extra Site Monthly | €9.99/month | per additional site |
| Extra Site Yearly | €99.99/year | per additional site |

Each additional site beyond the first is billed as a separate Stripe subscription item. The billing page shows a live breakdown: base plan + each extra site.

### Scan Limits

- **30 scans/month** per registered site on a paid plan
- Admins can grant `is_unlimited` (bypass all limits) or add a `crawl_quota_bonus` to any account

### VAT

- Handled automatically by **Stripe Tax** based on customer billing country
- EU B2B customers with a valid VAT number get reverse charge (0% VAT)
- Customers collect and manage their VAT number from their billing profile

### Trial Codes

Admins can generate one-time trial access codes in the format `XXXX-XXXX`. Each code:

- Is single-use
- Has an optional expiry date
- Can optionally be linked to a specific site URL
- Tracks who created it, who used it, and when

### Subscription Management

All subscription management happens through the **Stripe billing portal** — customers update their payment method, download invoices, manage extra site subscriptions, or cancel without contacting support. On cancel, access continues until the end of the current billing period.

---

## White-Label Sharing

Any audit report can be shared publicly via a UUID link (`/shared/{uuid}`). The share link:

- Requires no login
- Shows no 4uTest branding
- Displays the agency's logo, colours, and footer text if configured
- Can also be accessed as a branded PDF at `/shared/{uuid}/pdf`
- Is rate-limited to prevent abuse

---

## Agency Branding

Users can customise all exported and shared content with their own identity:

| Setting | Detail |
|---|---|
| Logo | Upload JPG / PNG / GIF / WebP (max 2 MB); stored in `storage/app/public/agency-logos/` |
| Primary colour | Hex code (e.g. `#7c3aed`) |
| Secondary colour | Hex code |
| Footer text | Custom text (max 255 chars) displayed in PDFs and shared reports |

When branding is configured, all shared report links and PDF exports display the agency's identity instead of 4uTest's.

---

## MCP Agent

The MCP Agent is a lightweight Docker container users deploy on the same server as their website. It exposes tools to **Claude Code** (Anthropic's AI coding assistant) via the **Model Context Protocol (MCP)**, giving Claude direct, live access to the server — so it can read the audit results and fix issues directly on the files, without any copy-pasting.

### What Claude Gets Access To

| Tool | What it does |
|---|---|
| `get_system_metrics` | Live CPU %, RAM (total / used / available GB), disk (total / used / free GB), network (bytes sent/received MB) |
| `run_speed_test` | Downloads 10 MB from Cloudflare, reports download speed in Mbps |
| `list_directory(path)` | List files inside the mounted workspace |
| `read_file(path)` | Read any file in the workspace (up to 5 MB) |
| `write_file(path, content)` | Create or overwrite a file; optionally creates parent directories |
| `get_file_info(path)` | File size, created, modified, permissions |
| `search_files(pattern, path)` | Glob pattern search across the workspace |
| `create_session_backup` | Immediately ZIP the entire workspace before making changes |
| `list_backups` | List all available backup archives |
| `get_audit_report` | Latest 4uTest scan results for the linked site (JSON) |

### Heartbeat

The agent calls `POST /api/agent/heartbeat` every 60 seconds (configurable). The payload includes CPU %, RAM %, and disk % metrics. The platform updates `last_ping_at` (used for the Online/Offline indicator) and can push the latest audit report JSON back in the response.

### Backups

- An immediate ZIP backup can be created on demand before Claude makes changes
- A daily automated backup runs at a configurable time (default 02:00 UTC)
- Only the most recent `MAX_BACKUPS` (default 10) archives are kept; older ones are deleted automatically
- Backups are stored in `/backups` inside the container

### Authentication

Each agent has a unique 64-character token generated at registration. The token is passed in the `Authorization: Bearer …` header on every heartbeat. The API URL (`https://4utest.io`) is hardcoded inside the Docker image — agents can only communicate with 4utest.io and cannot be redirected to another backend.

### Deployment — Auto Deploy (Recommended)

From the Agent dashboard, fill in:
- Server IP / hostname
- SSH port and user
- Password or SSH private key
- Project path on the server (e.g. `/var/www/html`)

Click **Deploy Agent**. The platform SSHes into the server using phpseclib and runs everything automatically:

1. `mkdir -p /opt/4utest-agent/backups`
2. `docker pull 4utest/mcp-agent:latest`
3. If a `4utest-agent` container already exists: stop and remove it only
4. `docker run -d --name 4utest-agent --restart unless-stopped -p 8765:8765 -e AGENT_TOKEN=… -v /your/project:/workspace -v /opt/4utest-agent/backups:/backups 4utest/mcp-agent:latest`
5. Open port 8765 on the firewall — detects `ufw` or `firewalld` automatically and adds the rule

No other containers, files, or services on the server are touched. No SSH tunnel is needed — Claude Code connects directly to the server on port 8765.

SSH credentials are transmitted over HTTPS, used for a single SSH session, and never written to the database or any log. See §9 of the Terms of Service for the full disclosure.

> **Cloud provider note:** If your server is behind a cloud firewall (AWS Security Groups, DigitalOcean Cloud Firewall, Hetzner Firewall, etc.), you must also open port 8765 there manually — the script can only control the OS-level firewall.

### Deployment — Manual

If you prefer not to provide SSH credentials, the dashboard shows a pre-filled `docker run` command with your token. Enter your project path and server IP, copy the two commands, and run them on your server:

```bash
# 1. Start the agent
docker run -d \
  --name 4utest-agent \
  --restart unless-stopped \
  -p 8765:8765 \
  -e AGENT_TOKEN=your-token \
  -v /your/project:/workspace \
  -v /opt/4utest-agent/backups:/backups \
  4utest/mcp-agent:latest

# 2. Open the firewall port
ufw allow 8765/tcp
```

### Connecting Claude Code

After deployment (auto or manual), port 8765 is open on the server. No SSH tunnel needed. Add this to `~/.claude/settings.json` on your local machine and restart Claude Code:

```json
{
  "mcpServers": {
    "4utest-agent": {
      "url": "http://your-server-ip:8765/sse"
    }
  }
}
```

The dashboard shows this config pre-filled with your server's actual IP after a successful auto-deploy. The agent appears in Claude Code's MCP servers list immediately. Tell Claude: *"Check my latest 4uTest audit and fix the top issues."*

### Agent Configuration (env vars)

| Variable | Default | Purpose |
|---|---|---|
| `AGENT_TOKEN` | — | **Required.** Authentication token from the dashboard |
| `MCP_SERVER_PORT` | `8765` | Port the MCP server listens on |
| `MAX_BACKUPS` | `10` | Maximum number of backup archives to keep |
| `BACKUP_HOUR` | `2` | Hour (UTC) for the daily automated backup |
| `BACKUP_MINUTE` | `0` | Minute for the daily automated backup |
| `HEARTBEAT_INTERVAL` | `60` | Seconds between heartbeat calls |

### Docker Image

The image is published automatically to Docker Hub (`4utest/mcp-agent:latest`) via GitHub Actions whenever changes are pushed to the `4u-test-agent/` directory. See [§14 GitHub Actions setup](#14-set-up-github-actions-secrets-required-for-the-mcp-agent-image) in the deployment guide.

---

## Support Tickets

Users open support tickets directly from the dashboard.

| Feature | Detail |
|---|---|
| Subject | Max 200 characters |
| Body | Max 5000 characters |
| Image attachments | Up to 3 per message; JPG / PNG / GIF / WebP; max 5 MB each |
| Thread | Full conversation history — user messages and admin replies in order |
| Statuses | open → in_progress → resolved → closed |
| Rate limiting | 10 ticket creations/minute; 20 replies/minute |

**Notifications:** When a user opens a ticket, the admin receives an email. When the admin replies, the user receives an email. All ticket emails are queued.

---

## Blog

A public blog at `/blog` with admin-managed posts.

### Post Fields

| Field | Detail |
|---|---|
| Title | Required, max 255 chars |
| Slug | Auto-generated, unique |
| Excerpt | Max 500 chars |
| Meta description | For SEO |
| Content | Rich HTML via TipTap editor |
| Featured image | URL |
| Locale | One of: en / el / de / fr / es / nl / cs |
| Status | `draft` / `published` / `scheduled` |
| Scheduled at | Optional future publish datetime |

Scheduled posts are published automatically by the `blog:publish-scheduled` command, which runs every minute.

### AI Draft Generation

Admins can generate a full blog post draft from a keyword using the Mistral API (`mistral-large-latest`, temperature 0.7). The AI returns a title, slug, excerpt, content, meta description, featured image URL, and the optimal publish day and hour (UTC). The draft is created with status `draft` for review before publishing. Requires `MISTRAL_API_KEY` in `.env`.

---

## Multi-Language Support

The full interface, all email notifications, and all PDF exports are available in **7 languages**:

| Code | Language |
|---|---|
| `en` | English |
| `el` | Greek |
| `de` | German |
| `fr` | French |
| `es` | Spanish |
| `nl` | Dutch |
| `cs` | Czech |

**Frontend:** i18next + react-i18next. Translation files at `resources/js/i18n/`. Browser language is auto-detected on first visit; the user can change it from their profile and the preference is saved to the database.

**Backend / Email / PDF:** Laravel's localisation system. Locale is set per-request based on the authenticated user's `language` field.

---

## Admin Panel

Accessible at `/admin` — requires `is_admin = true` on the user account.

### Users

| Capability | Detail |
|---|---|
| User list | All users, searchable by name or email |
| Stats bar | Total users, subscribed, unlimited, month / total crawls, open tickets |
| Per-user view | 6-month crawl activity chart; top 10 audited sites with URL, crawl count, avg score, last crawl date; Stripe subscription data (status, plan, next billing date) |
| Actions | Grant / revoke `is_admin`; grant / revoke `is_unlimited`; add `crawl_quota_bonus`; send direct email |
| Export | Full user list as CSV |

### Support Tickets

- All tickets across all users
- Filter by status (open / in_progress / resolved / closed)
- Read full threaded conversation
- Reply with optional file attachments
- Change status; close or reopen

### Blog

- Full CRUD for blog posts
- AI draft generation from a keyword (requires Mistral API key)
- Scheduled post management

### Server Monitoring

| Metric | Detail |
|---|---|
| CPU | Current load |
| RAM | Used / total / percentage |
| Disk | Used / free / percentage |
| Uptime | Server uptime |
| Database | MySQL ping time |
| Redis | Redis ping time |
| Queue | Pending jobs count; failed jobs count |
| Logs | Last 100 log entries, filterable by level (debug / info / warning / error / critical) |

### Trial Codes

- Generate `XXXX-XXXX` format codes
- View all codes: status, note, created by, used by, used at, expires at
- Update note on any code
- Delete unused codes

---

## Security Architecture

| Feature | Implementation |
|---|---|
| CSRF protection | Laravel built-in; Inertia-aware; exempt for API routes using token auth |
| Authentication | Laravel Breeze (session-based) + Sanctum (token-based for API) |
| Subscription gate | Custom `subscription` middleware — checks active Stripe sub or `is_unlimited` |
| Admin gate | Custom `admin` middleware — checks `is_admin = true` |
| Rate limiting | Per-route throttle middleware (see table below) |
| Trusted proxies | `TrustProxies` middleware; configured for Nginx reverse proxy |
| Session | Database-backed sessions; `SESSION_SECURE_COOKIE=true` in production |
| SSL | Let's Encrypt via Certbot; Nginx terminates TLS; HTTP → HTTPS enforced |
| Honeypot | Hidden `_hp` field on audit form; bot submissions are silently dropped |
| Server disclosure | Security audit module flags `Server` and `X-Powered-By` header leaks |

**Rate limits:**

| Route | Limit |
|---|---|
| Audit creation | `audit-store` (configurable) |
| Shared report view | Throttle per IP |
| Shared PDF export | Throttle per IP |
| Ticket creation | 10/minute |
| Ticket replies | 20/minute |
| Agent heartbeat | 120/minute |
| General API | 60/minute |

---

## API Endpoints

All routes in `routes/api.php`. Agent heartbeat uses Bearer token; all other authenticated routes use Sanctum session or token.

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/agent/heartbeat` | POST | Bearer token | Agent reports metrics; receives latest scan payload |
| `/api/health` | GET | None | Health check — DB and Redis connectivity |
| `/api/audit/full-report` | POST | Sanctum | Create a full 7-module audit |
| `/api/audit/full-report/status/{id}` | GET | Sanctum | Poll audit progress |
| `/api/audit/seo-schema` | POST/GET | Sanctum | Single SEO module audit or history |
| `/api/audit/security-infrastructure` | POST/GET | Sanctum | Single Security module |
| `/api/audit/performance` | POST/GET | Sanctum | Single Performance module |
| `/api/audit/marketing-tracking` | POST/GET | Sanctum | Single Tracking module |
| `/api/audit/broken-resources` | POST/GET | Sanctum | Single Broken Resources module |
| `/api/audit/catalog-integrity` | POST/GET | Sanctum | Single Catalog module |
| `/api/audit/accessibility` | POST/GET | Sanctum | Single Accessibility module |
| `/api/user` | GET | Sanctum | Current authenticated user |

---

## Queue & Scheduler

### Queue Jobs

| Job | Timeout | Purpose |
|---|---|---|
| `RunAuditorJob` | 600 s | Runs one audit module, saves result, triggers report finalisation when all 7 are done |
| `ProcessScheduledScan` | 60 s | Creates a report record and dispatches 7 `RunAuditorJob` jobs |

**Report finalisation** (`tryFinalize()` in `RunAuditorJob`): When all 7 module results are present, computes the health score, sets status to `completed`, sends the scan-completed email (with PDF attachment) if notifications are enabled, and pushes the report JSON to any linked MCP agent.

### Scheduled Commands

| Command | Frequency | Purpose |
|---|---|---|
| `scans:run` | Every minute | Finds due scheduled scans and dispatches them |
| `blog:publish-scheduled` | Every minute | Publishes scheduled blog posts whose `scheduled_at` has passed |

**Queue backend:** Redis. **Queue monitor:** Laravel Horizon (runs as a separate Docker container).

---

## Email System

All emails are queued (never sent inline) and respect the recipient's language setting.

| Email | Trigger | Recipient | Attachments |
|---|---|---|---|
| Scan completed | Scheduled scan finishes with notifications enabled | Site owner | PDF audit report |
| New ticket | User opens a support ticket | Admin (`ADMIN_SUPPORT_EMAIL`) | None |
| Ticket reply | Admin replies to a ticket | Ticket author | None |
| Admin direct email | Admin sends from user management panel | Any user | None |
| Password reset | User clicks "Forgot password" | User | None |
| Email verification | New account registration | New user | None |

---

## Production: Step-by-Step

Everything below takes you from a blank server to a live production deployment.

---

### Prerequisites

- A VPS with at least **2 GB RAM** and **20 GB disk** (4 GB RAM recommended if you expect concurrent audits)
- **Ubuntu 22.04** or 24.04 (the scripts assume Debian-based Linux)
- A **domain name** with access to its DNS settings
- A **Stripe account** (stripe.com)
- A **Brevo account** (brevo.com) for transactional email — the free plan sends up to 300 emails/day
- SSH access to the server

---

### 1. Point your domain to the server

In your domain registrar's DNS settings, create an **A record**:

```
Type:  A
Name:  @  (or your subdomain, e.g. app)
Value: <your server's IP address>
TTL:   300
```

Do this first. Let's Encrypt needs DNS to resolve before it can issue the SSL certificate. DNS propagation can take a few minutes to an hour.

---

### 2. Install Docker on the server

SSH into your server and run:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker compose version   # verify Compose v2 is installed
```

---

### 3. Clone the repository

```bash
git clone git@github.com:gveloper-m/4U-check.git /var/www/4utest
cd /var/www/4utest
```

---

### 4. Configure the production environment

```bash
cd /var/www/4utest/app-deploy
cp .env.example .env
nano .env
```

Fill in every value. Here is what each one means:

**Domain & SSL**
```env
DOMAIN=yourdomain.com          # your actual domain, no https://
CERTBOT_EMAIL=you@example.com  # receives Let's Encrypt expiry warnings
```

**Laravel app**
```env
APP_KEY=base64:...             # generate this — see step below
APP_URL=https://yourdomain.com
APP_DEBUG=false                # NEVER true in production
```

Generate the APP_KEY on your server:
```bash
docker run --rm php:8.3-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
```
Paste the output as APP_KEY.

**Database**
```env
DB_DATABASE=4utest_prod
DB_USERNAME=4utest_user
DB_PASSWORD=choose-a-strong-password      # no $ or special shell chars
DB_ROOT_PASSWORD=choose-a-different-strong-password
```

**Redis**
```env
REDIS_PASSWORD=choose-a-redis-password
```

**Session**
```env
SESSION_SECURE_COOKIE=true   # keep this — enforces HTTPS-only cookies
```

**Trusted proxies** (required — the app sits behind Nginx)
```env
TRUSTED_PROXIES=*
TRUSTED_HOSTS=yourdomain.com
```

Leave Stripe, mail, and Mistral fields blank for now — you'll fill them in the steps below.

---

### 5. Set up Stripe

#### 5a. Create your products and prices

Go to [dashboard.stripe.com](https://dashboard.stripe.com) → **Products** → **Add product**.

Create four products:

| Product name | Price | Billing period | Tax behaviour |
|---|---|---|---|
| 4uTest Pro Monthly | €19.99 | Monthly recurring | **Exclusive of tax** |
| 4uTest Pro Yearly | €199.99 | Yearly recurring | **Exclusive of tax** |
| 4uTest Extra Site Monthly | €9.99 | Monthly recurring | **Exclusive of tax** |
| 4uTest Extra Site Yearly | €99.99 | Yearly recurring | **Exclusive of tax** |

The base plan includes one monitored site. The extra site products are add-ons users subscribe to for each additional site. Setting "Exclusive of tax" means Stripe adds VAT on top based on the customer's country — correct for EU compliance.

Copy the `price_...` ID from each product into `.env`:
```env
STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_YEARLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_MONTHLY_EXTRA_SITE_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_YEARLY_EXTRA_SITE_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxxxx
```

#### 5b. Get your API keys

Stripe dashboard → **Developers** → **API keys**:
```env
STRIPE_KEY=pk_live_...      # Publishable key (starts with pk_live)
STRIPE_SECRET=sk_live_...   # Secret key (starts with sk_live)
```

#### 5c. Create a webhook

Stripe dashboard → **Developers** → **Webhooks** → **Add endpoint**:

- **Endpoint URL:** `https://yourdomain.com/stripe/webhook`
- **Events:** select `customer.subscription.*` and `invoice.*`

Click **Add endpoint**, then copy the **Signing secret**:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

This is what keeps your local database in sync with Stripe — when a payment succeeds, fails, or a subscription changes, Stripe calls this endpoint and the app updates accordingly.

#### 5d. Enable the customer billing portal

Stripe dashboard → **Settings** → **Billing** → **Customer portal** → Enable it.

This is the "Manage subscription" page where customers can update their card, download invoices, or cancel without contacting you.

#### 5e. Enable VAT collection (recommended)

If you have customers in the EU:

1. Stripe dashboard → **Tax** → **Get started** → Enable Stripe Tax
2. Add your tax registration for each country you sell in (at minimum Greece at 24%)
3. Set in `.env`:
```env
STRIPE_TAX_ENABLED=true
```

Stripe then automatically applies the correct VAT rate, gives 0% reverse charge to EU businesses with a valid VAT number, and includes everything on the invoice.

---

### 6. Set up Brevo for email

#### 6a. Create a Brevo account

Go to [brevo.com](https://brevo.com) and create a free account (300 emails/day free).

#### 6b. Verify your sender email address

Brevo → **Senders & IPs** → **Senders** → Add a sender. Enter your from address (e.g. `noreply@yourdomain.com`) and verify it. For best deliverability, also add the DKIM and SPF DNS records Brevo provides.

#### 6c. Get your SMTP credentials

Brevo → **SMTP & API** → **SMTP** tab:
- SMTP server: `smtp-relay.brevo.com`
- Port: `587`
- Login: shown on the page
- Password: generate one on that page

#### 6d. Whitelist your server's IP

Brevo → **Senders & IPs** → IP whitelist → Add your server's public IP. Without this, Brevo rejects SMTP connections.

```bash
curl -s https://api.ipify.org   # find your server's outbound IP
```

#### 6e. Fill in `.env`

```env
MAIL_MAILER=smtp
MAIL_SCHEME=null             # important: null for port 587 STARTTLS, NOT tls
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=xxxxxxx@smtp-brevo.com
MAIL_PASSWORD=your-brevo-smtp-key
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="4uTest"
ADMIN_SUPPORT_EMAIL=you@yourdomain.com   # where new ticket alerts go
```

---

### 7. Add the Mistral API key (AI blog feature)

Go to [console.mistral.ai](https://console.mistral.ai) → **API Keys** → create a key.

```env
MISTRAL_API_KEY=your-mistral-key
```

This is only used for AI blog post generation in the admin panel. Leave it empty if you don't need that feature.

---

### 8. Obtain the SSL certificate (run once)

```bash
cd /var/www/4utest/app-deploy
chmod +x scripts/init-letsencrypt.sh
./scripts/init-letsencrypt.sh
```

This script:
1. Creates a temporary self-signed certificate so Nginx can start
2. Starts Nginx so Let's Encrypt can reach the `.well-known/acme-challenge` path
3. Requests the real certificate from Let's Encrypt
4. Reloads Nginx with the real certificate

The certificate auto-renews every 12 hours via the Certbot container — you never need to touch it again.

---

### 9. Deploy the application

```bash
cd /var/www/4utest/app-deploy
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This script does everything: pulls the latest code, builds the Docker images, waits for MySQL to be healthy, runs database migrations, caches the Laravel config/routes/views, and starts all seven containers (Nginx, PHP-FPM, Horizon, Scheduler, MySQL, Redis, Certbot).

---

### 10. Create the admin account

Register normally at `https://yourdomain.com/register`, then promote to admin:

```bash
docker exec -it $(docker ps -qf "name=php-fpm") php artisan tinker

# Inside tinker — replace with your actual email:
\App\Models\User::where('email', 'you@yourdomain.com')
    ->update(['is_admin' => true, 'is_unlimited' => true]);
exit
```

`is_unlimited` bypasses the subscription check — you can run audits without subscribing. `is_admin` gives access to the `/admin` panel.

---

### 11. Test everything

**App basics**
- [ ] `https://yourdomain.com` loads (green padlock)
- [ ] Can register a new account
- [ ] Can log in

**Emails**
- [ ] Trigger a password reset — email arrives within 1–2 minutes
- [ ] Open a support ticket — admin receives notification email
- [ ] Reply to the ticket as admin — user receives notification email

**Stripe**
- [ ] Use Stripe test card (`4242 4242 4242 4242`) to subscribe
- [ ] Stripe Checkout opens with VAT calculation
- [ ] After payment, subscription is active in the billing page
- [ ] "Manage subscription" opens the Stripe billing portal

**Audits**
- [ ] Run a manual audit — completes within 60 seconds
- [ ] Score and all 7 module results appear
- [ ] Download the PDF export
- [ ] Enable sharing — share link opens without login, no 4uTest branding visible

**Scheduled scans**
- [ ] Create a scheduled scan with email notification enabled
- [ ] Click "Run now" to trigger immediately
- [ ] Email with PDF arrives after scan completes (allow 1–2 minutes)

**Admin panel**
- [ ] `/admin/users` shows the user list
- [ ] `/admin/monitoring` shows server metrics and queue status with no failed jobs

---

### 12. Switch to Stripe live mode

The steps above used test keys. Once you have tested everything:

1. Go to Stripe dashboard → toggle from **Test mode** to **Live mode** (top left)
2. Repeat step 5a — create the same four products and prices in live mode
3. Get your live API keys (step 5b) and live webhook (step 5c)
4. Update `.env` with all the live `pk_live_`, `sk_live_`, `whsec_`, and `price_` values
5. Redeploy:

```bash
cd /var/www/4utest/app-deploy
./scripts/deploy.sh
```

---

### 13. Set up database backups

The deploy has no automatic backup — set one up before you have real users.

A simple daily backup to a local file:

```bash
# Add to the server's crontab (crontab -e):
0 2 * * * cd /var/www/4utest/app-deploy && docker compose exec -T mysql mysqldump -u4utest_user -p"$DB_PASSWORD" 4utest_prod | gzip > /var/backups/4utest-$(date +\%Y\%m\%d).sql.gz
```

Or use a managed backup service — DigitalOcean Spaces, AWS S3, or Backblaze B2 with `rclone`.

---

### 14. Set up GitHub Actions secrets (required for the MCP Agent image)

The MCP Agent Docker image (`4utest/mcp-agent:latest`) is built and pushed to Docker Hub automatically whenever you push changes to the `4u-test-agent/` directory. This requires two secrets in your GitHub repository:

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. Add `DOCKERHUB_USERNAME` — your Docker Hub username (e.g. `4utest`)
3. Add `DOCKERHUB_TOKEN` — a Docker Hub access token (Docker Hub → **Account Settings** → **Security** → **New Access Token**)

Once set, any push to `4u-test-agent/` rebuilds and publishes the image automatically. To publish the initial image, trigger the workflow manually from the GitHub Actions tab.

---

### Ongoing: how to deploy code updates

```bash
cd /var/www/4utest/app-deploy
./scripts/deploy.sh
```

The script pulls the latest code, rebuilds images, migrates the database, recaches everything, and restarts containers.

---

## Useful Commands

```bash
# View all running containers
docker compose -f /var/www/4utest/app-deploy/docker-compose.yml ps

# View live app logs
docker compose -f /var/www/4utest/app-deploy/docker-compose.yml logs -f php-fpm

# View queue worker logs
docker compose -f /var/www/4utest/app-deploy/docker-compose.yml logs -f horizon

# View failed queue jobs
docker compose exec php-fpm php artisan queue:failed

# Retry all failed jobs
docker compose exec php-fpm php artisan queue:retry all

# Run a tinker session (database queries, model inspection)
docker compose exec php-fpm php artisan tinker

# Manually clear all caches
docker compose exec php-fpm php artisan cache:clear
docker compose exec php-fpm php artisan view:clear
docker compose exec php-fpm php artisan config:clear

# Check Horizon queue status
docker compose exec php-fpm php artisan horizon:status
```

---

## License

Private / proprietary. All rights reserved.
