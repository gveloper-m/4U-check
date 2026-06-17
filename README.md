# 4uTest — Website Audit Platform

A full-stack SaaS web audit tool that runs 7 deep analysis modules in parallel on any website and returns a scored health report out of 100. Built for agencies and businesses that need recurring, structured website monitoring.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features at a Glance](#features-at-a-glance)
3. [Audit Modules](#audit-modules)
4. [Local Development](#local-development)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Production Deployment](#production-deployment)
7. [Stripe Setup](#stripe-setup)
8. [Email Setup](#email-setup)
9. [Admin Panel](#admin-panel)
10. [Health Score](#health-score)
11. [Project Structure](#project-structure)
12. [Security Hardening](#security-hardening)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13 · PHP 8.4+ |
| Frontend | React 18 · TypeScript · Inertia.js v2 |
| Styling | Tailwind CSS v4 (dark theme) |
| Queue | Laravel Queues + Redis |
| Database | MySQL 8.4 |
| Payments | Stripe + Laravel Cashier |
| i18n | i18next — EN / EL / DE / FR / ES / NL / CS |
| Dev environment | Docker (Laravel Sail) |
| Production | Docker Compose — Nginx + PHP-FPM + Horizon + Certbot |

---

## Features at a Glance

| Feature | Detail |
|---|---|
| **7 audit modules** | SEO, Security, Performance, Broken Resources, E-commerce, Marketing, Accessibility |
| **Health score** | 0–100, colour-coded, deduction-breakdown per module |
| **Scan history** | Full audit history with status, score, date |
| **Compare** | Side-by-side view of 2–3 scans |
| **Scheduled scans** | Hourly / daily / weekly / monthly — email notification on completion |
| **Quota system** | 120 scans/month per user; unlimited accounts bypass |
| **PDF & CSV exports** | Formatted for client delivery, translated, branded with agency logo |
| **White-label share links** | Public UUID-based links — no login required, zero 4utest branding |
| **Agency mode** | Custom logo, primary/secondary colours, footer text |
| **Support tickets** | Threaded tickets with photo attachments, email notifications |
| **Blog** | Admin-managed blog with public listing |
| **Billing** | Two plans: €22/mo or €220/yr (both excl. VAT), Stripe Checkout with VAT collection |
| **Admin panel** | User management, monitoring dashboard, ticket panel, blog CMS |
| **Error pages** | Branded 401/403/404/419/429/500/503 pages |
| **Monitoring** | Live server metrics (RAM, CPU, Disk, Uptime), app health, log viewer |
| **7 languages** | Full UI + PDF + email translation |

---

## Audit Modules

### 1 — SEO & Schema
Meta title/description (presence + length), H1 tags, canonical URL, Open Graph, JSON-LD structured data, image alt text, `robots.txt`, `sitemap.xml`.

### 2 — Security
SSL validity, expiry, issuer, HTTPS redirect, mixed content detection. Six HTTP security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. DNS: SPF, DMARC, DKIM records.

### 3 — Performance
TTFB, FCP, LCP, CLS (desktop + mobile). Gzip/Brotli compression, render-blocking scripts/stylesheets, HTML page size.

### 4 — Broken Resources
Full internal crawl — every link and image tested for HTTP 4xx/5xx. Reports total counts, percentages, and the full list of broken URLs **with the source page each was found on**.

### 5 — E-commerce Catalog
Detects product pages and audits for: missing/malformed prices, stock mismatches between schema.org and visible UI, disabled add-to-cart buttons.

### 6 — Marketing Tracking
Detects Google Analytics 4, Facebook Pixel, TikTok Pixel across crawled pages. Reports pixel IDs found per page.

### 7 — Accessibility (WCAG)
Form labels, image alt text, ARIA attributes, heading hierarchy (H1→H2→H3), landmark elements (`<main>`, skip nav), colour contrast ratios.

---

## Local Development

### Prerequisites

- Docker + Docker Compose v2
- Node.js 18+
- Composer (optional — `vendor/` is committed)

### Start the stack

```bash
# Clone and enter the repo
git clone git@github.com:gveloper-m/4U-check.git 4utest && cd 4utest

# Copy and edit env
cp .env.example .env          # fill in APP_KEY, Stripe keys, mail settings

# Generate app key if starting fresh
docker run --rm -v "$PWD":/app -w /app php:8.4-cli php artisan key:generate

# Start all containers (app + mysql + redis + queue worker)
./vendor/bin/sail up -d

# Run migrations
docker exec 4utest-laravel.test-1 php artisan migrate

# Install JS dependencies and build
npm install && npm run build

# OR run with hot reload
npm run dev
```

> **Port conflicts?** If MySQL 3306 or Redis 6379 are already in use, add to `.env`:
> ```
> FORWARD_DB_PORT=3307
> FORWARD_REDIS_PORT=6380
> ```
> Then restart: `./vendor/bin/sail up -d`

### Local URLs

| Service | URL |
|---|---|
| App | http://localhost |
| Vite dev server | http://localhost:5173 |
| MySQL (host) | localhost:3307 |
| Redis (host) | localhost:6380 |

### Default admin account

```
Email:    admin@4utest.gr
Password: admin4utest2024
```

The admin account has `is_admin = true` and `is_unlimited = true`.

### Queue worker

The queue worker runs as a separate `queue` container automatically when you `sail up`. To check its logs:

```bash
docker logs 4utest-queue-1 -f
```

To restart it:

```bash
./vendor/bin/sail restart queue
```

### Run the scheduler locally

```bash
docker exec 4utest-laravel.test-1 php artisan schedule:work
```

### Clear caches after code changes

```bash
docker exec 4utest-laravel.test-1 php artisan route:clear
docker exec 4utest-laravel.test-1 php artisan config:clear
docker exec 4utest-laravel.test-1 php artisan view:clear
```

### Useful admin commands

```bash
# View failed queue jobs
docker exec 4utest-laravel.test-1 php artisan queue:failed

# Retry all failed jobs
docker exec 4utest-laravel.test-1 php artisan queue:retry all

# Flush failed jobs table
docker exec 4utest-laravel.test-1 php artisan queue:flush

# Seed the database (if a seeder exists)
docker exec 4utest-laravel.test-1 php artisan db:seed
```

---

## Environment Variables Reference

All variables below must be set in `.env` (development) or `deploy/.env` (production).

### Application

```env
APP_NAME=4uTest
APP_ENV=production           # local | production
APP_KEY=base64:...           # php artisan key:generate --show
APP_DEBUG=false              # NEVER true in production
APP_URL=https://yourdomain.com
APP_LOCALE=en
```

### Database

```env
DB_CONNECTION=mysql
DB_HOST=mysql                # container name inside Docker network
DB_PORT=3306
DB_DATABASE=4utest_prod
DB_USERNAME=4utest_user
DB_PASSWORD=strong-password
```

### Cache & Queue

```env
CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_HOST=redis             # container name inside Docker network
REDIS_PORT=6379
REDIS_PASSWORD=null          # set if Redis auth is enabled
```

### Session

```env
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true   # REQUIRED in production (HTTPS only)
```

### Mail

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com    # or smtp.mailgun.org, smtp.sendgrid.net, etc.
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=re_...
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="4uTest"

# Admin receives emails for new support tickets (defaults to MAIL_FROM_ADDRESS)
ADMIN_SUPPORT_EMAIL=support@yourdomain.com
```

### Stripe (Payments)

```env
STRIPE_KEY=pk_live_...            # Publishable key
STRIPE_SECRET=sk_live_...         # Secret key
STRIPE_WEBHOOK_SECRET=whsec_...   # From Stripe dashboard → Webhooks

# Two billing plans — create in Stripe dashboard as tax-exclusive prices
STRIPE_MONTHLY_PRICE_ID=price_...  # €22/month excl. VAT
STRIPE_YEARLY_PRICE_ID=price_...   # €220/year excl. VAT

# Automatic VAT calculation via Stripe Tax (see Stripe Setup section)
STRIPE_TAX_ENABLED=false           # Set true after enabling Stripe Tax

CASHIER_CURRENCY=eur
CASHIER_CURRENCY_LOCALE=el_GR      # locale used for currency formatting
```

### Chromium (for audits)

```env
CHROME_PATH=/usr/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

### Trusted Proxies (production — behind Nginx)

```env
TRUSTED_PROXIES=*
TRUSTED_HOSTS=yourdomain.com
```

---

## Production Deployment

A complete Docker Compose production stack lives in `deploy/`. It includes:
- **Nginx** — reverse proxy + automatic HTTPS via Let's Encrypt
- **PHP-FPM** — Laravel app with Chromium for audits
- **Queue worker** — dedicated container for audit jobs
- **Scheduler** — runs `artisan schedule:run` every minute
- **MySQL 8.4** — persistent data volume
- **Redis 7** — cache + queue backend
- **Certbot** — automatic SSL certificate renewal

### Step-by-step first deploy

```bash
# 1. Point your domain's A record to the server IP — do this first.
#    Let's Encrypt requires DNS to propagate before certificate issuance.

# 2. SSH into the server and clone the repo
git clone git@github.com:gveloper-m/4U-check.git /var/www/4utest
cd /var/www/4utest/deploy

# 3. Create and fill the production .env
cp .env.example .env
nano .env    # fill in all REPLACE_ME values

# 4. Obtain the first SSL certificate (run only once)
chmod +x scripts/init-letsencrypt.sh
./scripts/init-letsencrypt.sh

# 5. Build images and start all services
docker compose up -d --build

# 6. Run migrations
docker compose exec php-fpm php artisan migrate --force

# 7. Seed the admin user (if seeder exists)
docker compose exec php-fpm php artisan db:seed --class=AdminSeeder

# 8. Set correct storage permissions
docker compose exec php-fpm php artisan storage:link
```

### Subsequent deploys

```bash
cd /var/www/4utest
git pull origin master
cd deploy
./scripts/deploy.sh
```

The deploy script: pulls the latest image, runs migrations, clears caches, and restarts containers with zero downtime.

### Cron (scheduler)

The scheduler container runs inside Docker. No host cron entry is needed — it's managed by the `scheduler` service in `deploy/docker-compose.yml`.

### SSL renewal

Certbot renews certificates automatically. The Nginx container reloads after renewal via a cron inside the `certbot` container.

### Backups

Recommended: daily MySQL dump to an S3-compatible bucket.

```bash
# Example manual backup
docker compose exec mysql mysqldump -u4utest_user -pPASSWORD 4utest_prod | gzip > backup-$(date +%Y%m%d).sql.gz
```

---

## Stripe Setup

### 1. Create two products and prices

In the [Stripe dashboard](https://dashboard.stripe.com) → Products → Add product:

| Product | Price | Billing | Tax behaviour |
|---|---|---|---|
| 4uTest Pro — Monthly | €22.00 | Monthly recurring | **Exclusive of tax** |
| 4uTest Pro — Yearly | €220.00 | Yearly recurring | **Exclusive of tax** |

> **Important:** Set the tax behaviour to **"Exclusive of tax"** on both prices. This is what makes €22 + VAT work correctly.

Copy each `price_...` ID into `.env`:
```env
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
```

### 2. Configure the webhook

Stripe dashboard → Developers → Webhooks → Add endpoint:

- **URL:** `https://yourdomain.com/stripe/webhook`
- **Events to listen to:** `customer.subscription.*`, `invoice.*`

Copy the signing secret → `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Enable VAT collection (recommended)

The checkout already collects billing addresses and VAT numbers from customers. To also **calculate and charge VAT automatically**:

1. Stripe dashboard → **Tax** → Enable Stripe Tax
2. Add your tax registrations per country:

| Country | VAT label | Rate |
|---|---|---|
| Greece (GR) | ΦΠΑ | 24% |
| Germany (DE) | MwSt | 19% |
| France (FR) | TVA | 20% |
| Spain (ES) | IVA | 21% |
| Netherlands (NL) | BTW | 21% |
| Czech Republic (CZ) | DPH | 21% |
| United Kingdom (GB) | VAT | 20% |

3. Set in `.env`:
```env
STRIPE_TAX_ENABLED=true
```

When enabled, Stripe automatically:
- Calculates VAT based on the customer's billing country
- Applies **reverse charge (0% VAT)** for EU businesses with a valid VAT number
- Includes VAT on Stripe-generated invoices

### 4. Customer billing portal

The **Manage Subscription** button redirects customers to Stripe's hosted billing portal (cancel, update card, download invoices). Enable it in Stripe dashboard → Settings → Billing → Customer portal.

---

## Email Setup

The app sends emails for:
- Audit completion (if email notification is enabled on a scheduled scan)
- New support ticket (to admin)
- Admin reply on a ticket (to user)

Recommended providers: **Resend**, Mailgun, SendGrid, AWS SES.

### Resend (recommended)

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=re_your_api_key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
```

You must verify your domain in Resend and add the required DNS records.

---

## Admin Panel

The admin panel is available at `/admin/*` and is only accessible to users with `is_admin = true`.

### Grant admin access

```bash
docker compose exec php-fpm php artisan tinker
# Inside tinker:
\App\Models\User::where('email', 'user@example.com')->update(['is_admin' => true]);
```

### Admin sections

| URL | Description |
|---|---|
| `/admin/users` | All users — crawl stats, plan, last activity |
| `/admin/users/{id}` | User detail — 6-month chart, top sites, Stripe subscription data, toggle admin/unlimited |
| `/admin/tickets` | Support tickets — filter by status, full thread view, reply, status management |
| `/admin/monitoring` | Server health — RAM, CPU, Disk, Uptime, DB/Redis ping, queue status, log viewer |
| `/admin/blog` | Blog CMS — create, edit, delete posts |

### Monitoring dashboard

`/admin/monitoring` auto-refreshes every 30 seconds. Shows:

- **Status row:** Database (with ping time), Redis, Queue (pending/failed jobs), Debug mode warning
- **System metrics:** RAM used/total with bar, CPU load (1/5/15 min), Disk used/total, server uptime
- **App info:** Laravel version, PHP version, environment, timezone, log file size
- **Log viewer:** Last 100 entries from `storage/logs/laravel.log`, filterable by level (ERROR / WARNING / NOTICE / INFO etc.) and full-text searchable

---

## Health Score

Every completed scan returns a score 0–100. Modules with missing data score 0 for those checks.

| Issue | Penalty |
|---|---|
| Invalid / missing SSL | −20 |
| SSL expiring within 30 days | −10 |
| Mixed content detected | −10 |
| Most security headers missing | −10 |
| Slow TTFB (> 1 500 ms) | −10 |
| More than 10 broken links | −10 |
| No SPF record | −5 |
| No DMARC record | −5 |
| Bad meta title | −5 |
| Missing Open Graph tags | −5 |
| No structured data | −5 |
| Broken images | −5 |
| Compression not enabled | −5 |
| … and more module-specific checks | varies |

---

## Project Structure

```
app/
  Http/
    Controllers/
      AuditController.php                    # Audit orchestration, quota, share toggle
      SharedReportController.php             # Public white-label page + PDF
      BillingController.php                  # Stripe Checkout, portal, VAT
      TicketController.php                   # User support tickets
      DashboardController.php
      ProfileController.php
      AgencyController.php                   # Agency logo + branding
      BlogController.php
      ScheduledScanController.php
      LanguageController.php
      Admin/
        UserController.php                   # Admin user management
        TicketController.php                 # Admin ticket management
        MonitoringController.php             # Server + app health
        BlogController.php
      # Audit modules (one controller each):
      SeoSchemaAuditController.php
      SecurityInfrastructureController.php
      PerformanceAuditController.php
      BrokenResourceController.php
      EcommerceCatalogAuditController.php
      TrackingAuditController.php
      AccessibilityAuditController.php
    Middleware/
      HandleInertiaRequests.php              # Shared Inertia props (auth, flash, locale)
      EnsureUserIsAdmin.php
      RequireActiveSubscription.php
    Rules/
      PublicUrl.php                          # SSRF protection
  Jobs/
    RunAuditorJob.php                        # Dispatches all 7 audit modules
    ProcessScheduledScan.php
  Models/
    User.php                                 # Cashier trait, is_admin, is_unlimited, vat_number
    FullAuditReport.php                      # share_uuid, share_enabled
    ScheduledScan.php
    Ticket.php / TicketMessage.php / TicketAttachment.php
  Mail/
    ScanCompletedMail.php
    TicketNewMail.php                        # New ticket → admin
    TicketReplyMail.php                      # Admin reply → user

bootstrap/
  app.php                                    # Exception handler — branded error pages for Inertia

config/
  services.php                               # stripe.monthly_price_id, yearly_price_id, tax_enabled

database/migrations/
  ...standard Laravel migrations...
  *_create_full_audit_reports_table.php
  *_add_share_fields_to_full_audit_reports.php
  *_create_tickets_tables.php
  *_add_vat_number_to_users_table.php

resources/
  js/
    Pages/
      Dashboard.tsx
      Audits/Index.tsx                       # Quota progress bar
      Audits/Show.tsx                        # Module tabs, share toggle, found_on display
      Audits/Compare.tsx
      Shared/Report.tsx                      # Public white-label (no AppLayout)
      Billing/Index.tsx                      # Plan selector (€22/€220 + VAT), company/VAT fields
      Tickets/Index.tsx                      # User ticket list + new ticket form
      Tickets/Show.tsx                       # User ticket thread
      ScheduledScans/Index.tsx
      Profile/Edit.tsx
      Blog/ Admin/Blog/
      Admin/
        Users/Index.tsx                      # 6 stat cards + user table
        Users/Show.tsx                       # User detail: chart, top sites, Stripe card
        Tickets/Index.tsx                    # Admin tickets table
        Tickets/Show.tsx                     # Admin ticket thread + status
        Monitoring.tsx                       # Server metrics + log viewer
    Layouts/
      AppLayout.tsx                          # Dark sidebar, admin badge, help footer
    i18n/
      en.ts  el.ts  de.ts  fr.ts  es.ts  nl.ts  cs.ts
  views/
    errors/
      _layout.blade.php                      # Shared branded error layout
      401.blade.php  403.blade.php  404.blade.php
      419.blade.php  429.blade.php  500.blade.php  503.blade.php
    exports/
      audit-report.blade.php                 # DomPDF template
    mail/
      scan-completed.blade.php
      ticket-new.blade.php
      ticket-reply.blade.php

routes/
  web.php                                    # All web routes
  api.php                                    # Sanctum-protected audit status endpoint
  console.php                                # Scheduled scan command

deploy/                                      # Production Docker stack
  docker-compose.yml
  .env.example
  backend/Dockerfile
  frontend/Dockerfile                        # Nginx + SSL
  scripts/
    init-letsencrypt.sh                      # First-time SSL certificate setup
    deploy.sh                                # Pull → build → migrate → restart
```

---

## Security Hardening

| Area | Measure |
|---|---|
| **SSRF protection** | `PublicUrl` validation rule — blocks private/loopback/reserved IPs, verifies DNS resolves to public IP |
| **Mass assignment** | `is_admin` / `is_unlimited` removed from `User::$fillable`; set only via `forceFill()` in admin controllers |
| **API authentication** | All `/api/*` routes require `auth:sanctum` |
| **Stripe webhooks** | Routed to Cashier's `WebhookController`; signature verified automatically; CSRF-exempt via `preventRequestForgery(except:)` |
| **File uploads** | SVG blocked; `mimetypes:` binary check (not extension-based `mimes:`) to prevent MIME confusion |
| **Rate limiting** | Named rate limiters on: shared report pages (60/min), PDF downloads (10/min), audit creation, new ticket (10/hr), ticket reply (20/min), registration, password reset |
| **Inertia props** | Strict allowlist — Stripe keys, session tokens, raw exception data never sent to the frontend |
| **Shared pages** | `$report->unsetRelation('user')` before render — no user PII in public page HTML |
| **Session cookies** | `SESSION_SECURE_COOKIE=true` in production (HTTPS-only) |
| **Admin routes** | Protected by `admin` middleware (`EnsureUserIsAdmin`) — 403 for non-admins |
| **Input validation** | UUID route regex, `min:1` on IDs, sanitized Content-Disposition filenames |
| **Error pages** | `APP_DEBUG=false` in production — branded error pages replace stack traces; Inertia XHR errors also get branded pages |
| **Subscription gate** | `RequireActiveSubscription` middleware on all audit routes — admins and unlimited accounts bypass |

---

## Languages

All 7 languages cover the full UI, PDF/CSV exports, and email notifications. The selected language is saved per user account.

| Code | Language | Target countries |
|---|---|---|
| `en` | English | Global / UK / US |
| `el` | Greek | Greece (GR — 24% VAT) |
| `de` | German | Germany (DE — 19% VAT) |
| `fr` | French | France (FR — 20% VAT) |
| `es` | Spanish | Spain (ES — 21% VAT) |
| `nl` | Dutch | Netherlands (NL — 21% VAT) |
| `cs` | Czech | Czech Republic (CZ — 21% VAT) |

---

## License

Private / proprietary. All rights reserved.
