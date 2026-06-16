# 4utest — Website Audit Platform

A full-stack SaaS web audit tool that runs 7 deep analysis modules in parallel on any website and returns a scored health report out of 100.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13.8 · PHP 8.4 |
| Frontend | React 18 · TypeScript · Inertia.js v2 |
| Styling | Tailwind CSS v4 (dark theme) |
| Queue | Laravel Queues (Redis) |
| Database | MySQL 8 |
| Payments | Stripe (Laravel Cashier) |
| i18n | i18next — English, Greek, German, French, Spanish, Dutch, Czech |
| Containerisation | Docker (Laravel Sail for dev · custom stack for production) |

---

## Local Development URLs

| Service | URL |
|---|---|
| App (web) | http://localhost |
| Vite dev server | http://localhost:5173 |
| MySQL | localhost:3307 |
| Redis | localhost:6380 |

> The dev environment runs HTTP only. Use `http://localhost` — not `https://`.

---

## Default Admin Account

```
Email:    admin@4utest.gr
Password: admin4utest2024
```

> The admin account has `is_unlimited = true`, bypassing all subscription and quota checks.

---

## Getting Started

### Prerequisites

- Docker + Docker Compose
- Node.js 18+

### Start the dev stack

```bash
# Start all containers (app, mysql, redis)
./vendor/bin/sail up -d

# Run database migrations (must run inside the container — DB_HOST=mysql resolves only there)
docker exec 4utest-laravel.test-1 php artisan migrate

# Install JS dependencies and build assets
npm install
npm run build

# Or run the dev server with hot reload
npm run dev
```

### Run the queue worker

```bash
docker exec 4utest-laravel.test-1 php artisan queue:work --timeout=600
```

---

## Running a Scan

1. Log in at http://localhost
2. Go to **Audits** in the sidebar
3. Enter a website URL (e.g. `https://example.com`) and an optional name
4. Click **Run Audit** — 7 modules start in parallel as queued jobs
5. The page auto-refreshes every 3 seconds until all modules complete
6. View the health score, per-module results, and score deductions

---

## Audit Modules (7 total)

### 1. SEO & Schema
Checks meta title/description length and status, H1 tags, canonical URL, Open Graph tags, JSON-LD structured data, image alt text, `robots.txt`, and `sitemap.xml`.

### 2. Security
Validates SSL certificate (validity, issuer, days remaining), HTTPS redirect enforcement, mixed content detection, 6 HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), and DNS records: SPF, DMARC, DKIM.

### 3. Performance
Measures TTFB, FCP, LCP, and CLS on desktop and mobile. Detects gzip/brotli compression, render-blocking scripts and stylesheets, and HTML page size.

### 4. Broken Resources
Crawls all internal pages and checks every link and image for HTTP 4xx/5xx errors. Reports total broken counts, percentages, and the full list of broken URLs with the page each was found on.

### 5. E-commerce Catalog
Finds product pages and audits each for: missing or malformed prices, stock availability mismatches between schema.org data and visible UI, and disabled add-to-cart buttons.

### 6. Marketing Tracking
Detects Google Analytics 4, Facebook Pixel, and TikTok Pixel across crawled pages. Reports pixel IDs found.

### 7. Accessibility (WCAG)
Checks form labels, image alt text, ARIA attributes, heading hierarchy (H1→H2→H3 order), landmark elements (`<main>`, skip navigation), and color contrast ratios.

---

## Health Score

Every completed scan scores 0–100. Key deductions:

| Issue | Penalty |
|---|---|
| Invalid / missing SSL | −20 |
| SSL expiring within 30 days | −10 |
| Mixed content detected | −10 |
| Most security headers missing | −10 |
| Slow TTFB (> 1500 ms) | −10 |
| More than 10 broken links | −10 |
| No SPF record | −5 |
| No DMARC record | −5 |
| Bad meta title | −5 |
| Missing Open Graph tags | −5 |
| No structured data | −5 |
| Broken images | −5 |
| Compression not enabled | −5 |
| … and more | … |

---

## Monthly Scan Quota

Each user is limited to **120 scans per calendar month**. Usage can be spread freely — 4/day, 8 every two days, burst all at once, etc. The quota resets on the 1st of each month.

- Enforced at all three entry points: manual scans, manual run-now of scheduled scans, and cron-triggered scheduled scans
- The Audits page shows a live progress bar (violet → amber → red) with remaining count and reset date
- Unlimited accounts (`is_unlimited = true`) bypass the quota entirely

---

## Scheduled Scans

Set up automatic scans to run **hourly / daily / weekly / monthly**. Toggle on/off from the Scheduled Scans page. Enable **Email notification** to receive an email in your preferred language when each scan completes.

The scheduler runs via `php artisan schedule:run` (or the `scans:run` command) every minute — wire this up to cron in production:

```cron
* * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1
```

---

## Exports

From any completed audit report:
- **PDF** — formatted summary ready for client delivery
- **CSV** — full raw data for further analysis in Excel or other tools

Both exports are generated in the user's preferred language.

---

## Compare

From Scan History, select 2–3 completed scans and click **Compare** for a side-by-side view of all key metrics.

---

## White-Label Share Links (Agency)

Agency accounts can generate a public share link for any completed report:

1. Open a completed report → toggle **Enable Public Share Link**
2. Copy the URL: `https://yourdomain.com/shared/{uuid}`
3. Share it with the end client — **no login required**

The shared page has **zero 4utest branding**: only the agency's logo, primary/secondary colors, and footer text. A branded **Download PDF** button is included at `/shared/{uuid}/pdf`.

- Refreshing the shared link 500× costs nothing — quota is charged only when **Run Audit** is clicked
- Rate-limited: 60 req/min per IP for the page, 10 req/min for the PDF
- UUID-constrained routes; user data is never exposed in the public page HTML

---

## Support Ticket System

All authenticated users can submit support tickets at `/tickets`:

- **Open tickets** with a subject, message body, and up to 3 photo attachments (JPEG/PNG/GIF/WebP, max 5 MB each)
- **Threaded replies** — users and admins exchange messages in a chat-style view
- **Status tracking** — open → in_progress → resolved → closed
- **Email notifications** — admin receives an email for each new ticket; user receives an email for each admin reply
- A subtle **Need help?** link appears in the footer of every authenticated page

### Admin ticket panel

Accessible at `/admin/tickets` (sidebar entry with a live badge showing open + in-progress count):

- Filter tickets by status with counts per category
- Full thread view per ticket
- Reply form with image attachments
- One-click status change sidebar

---

## Languages

The entire platform is translated into 7 languages. The language preference is saved per user account and applied to the UI, PDF/CSV exports, and notification emails.

| Code | Language |
|---|---|
| `en` | English |
| `el` | Greek |
| `de` | German |
| `fr` | French |
| `es` | Spanish |
| `nl` | Dutch |
| `cs` | Czech |

---

## Security

Key hardening measures in place:

| Area | Protection |
|---|---|
| SSRF | `PublicUrl` validation rule — blocks private/reserved IPs, validates DNS resolves to public IP |
| Mass assignment | `is_admin` / `is_unlimited` removed from `$fillable` on User model |
| API auth | All `/api/audit/*` routes require `auth:sanctum` |
| Stripe webhooks | Routed to Cashier's `WebhookController` with automatic signature verification; CSRF-exempt via `preventRequestForgery(except: ['stripe/webhook'])` |
| File uploads | SVG blocked; binary `mimetypes:` check instead of extension-based `mimes:` |
| Rate limiting | Named limiters on shared reports, PDF, audit creation, registration, and password reset |
| Inertia props | Explicit allowlist — Stripe fields, session tokens never sent to the frontend |
| Shared pages | `unsetRelation('user')` before Inertia render; no user PII in public HTML |
| Session cookies | `SESSION_SECURE_COOKIE=true` enforced in production |
| Input validation | UUID route regex, `min:1` on IDs, sanitized Content-Disposition filenames, cookie version regex |

---

## Project Structure

```
app/
  Http/Controllers/
    AuditController.php                   # Orchestrates all 7 modules, enforces quota, share toggle
    SharedReportController.php            # Public white-label share page + PDF
    TicketController.php                  # User-facing support tickets
    Admin/
      BlogController.php
      TicketController.php                # Admin ticket management
    SeoSchemaAuditController.php
    SecurityInfrastructureController.php
    PerformanceAuditController.php
    BrokenResourceController.php
    EcommerceCatalogAuditController.php
    TrackingAuditController.php
    AccessibilityAuditController.php
    ScheduledScanController.php
    LanguageController.php
    BillingController.php
    DashboardController.php
    ProfileController.php
    BlogController.php
  Rules/
    PublicUrl.php                         # SSRF protection validation rule
  Jobs/
    RunAuditorJob.php
    ProcessScheduledScan.php
  Models/
    User.php
    FullAuditReport.php                   # share_uuid, share_enabled
    ScheduledScan.php
    Ticket.php
    TicketMessage.php
    TicketAttachment.php
  Mail/
    ScanCompletedMail.php
    TicketReplyMail.php                   # Admin reply → user email
    TicketNewMail.php                     # New ticket → admin email

resources/
  js/
    Pages/
      Dashboard.tsx
      Audits/Index.tsx
      Audits/Show.tsx                     # Share link toggle panel
      Audits/Compare.tsx
      Shared/Report.tsx                   # Public white-label report (no AppLayout)
      Tickets/Index.tsx                   # User ticket list + new ticket form
      Tickets/Show.tsx                    # User ticket thread + reply
      Admin/Tickets/Index.tsx             # Admin tickets table with filter tabs
      Admin/Tickets/Show.tsx              # Admin ticket thread + reply + status
      ScheduledScans/Index.tsx
      Profile/Edit.tsx
      Billing/Index.tsx
      Blog/
      Admin/Blog/
    i18n/
      en.ts  el.ts  de.ts  fr.ts  es.ts  nl.ts  cs.ts
    Layouts/
      AppLayout.tsx                       # Sidebar with admin ticket badge + footer help link
      GuestLayout.tsx
    Components/
      LanguageSwitcher.tsx
      CookieBanner.tsx

  views/
    mail/
      scan-completed.blade.php
      ticket-reply.blade.php
      ticket-new.blade.php

database/migrations/
  ...
  2026_06_16_160000_add_share_fields_to_full_audit_reports.php
  2026_06_16_200000_create_tickets_tables.php

deploy/                                   # Production Docker stack
  docker-compose.yml
  nginx/
  certbot/
  .env.example
```

---

## Environment Variables

```env
APP_URL=https://yourdomain.com
APP_KEY=base64:...

DB_HOST=mysql
DB_DATABASE=4utest
DB_USERNAME=sail
DB_PASSWORD=password

REDIS_HOST=redis

STRIPE_KEY=pk_...
STRIPE_SECRET=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=re_...
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="4utest"

# Support ticket notifications — defaults to MAIL_FROM_ADDRESS if not set
ADMIN_SUPPORT_EMAIL=support@yourdomain.com

# Must be true in production (HTTPS-only session cookies)
SESSION_SECURE_COOKIE=true
```

---

## Production Deployment

A full production Docker stack lives in the `deploy/` folder:

```bash
cd deploy
cp .env.example .env   # fill in your values
docker compose up -d
```

The stack includes Nginx with automatic Let's Encrypt SSL, MySQL, Redis, a PHP-FPM app container, and a queue worker. Point your domain's DNS A record to the server IP before running — Certbot handles certificate issuance automatically.

---

## License

Private / proprietary.
