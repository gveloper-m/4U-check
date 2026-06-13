# 4uTest — Website Audit Platform

A full-stack SaaS web audit tool that runs 6 deep analysis modules in parallel on any website and returns a scored health report.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13.8 · PHP 8.3 |
| Frontend | React 18 · TypeScript · Inertia.js v2 |
| Styling | Tailwind CSS v3 (dark theme) |
| Queue | Laravel Horizon (Redis) |
| Database | MySQL 8 |
| Payments | Stripe (Laravel Cashier) |
| Headless browser | Google Chrome + Browsershot/Lighthouse |
| i18n | i18next (English + Greek) |
| Containerisation | Docker (Laravel Sail) |

---

## Local URLs

| Service | URL |
|---|---|
| App (web) | http://localhost |
| Vite dev server | http://localhost:5173 |
| Laravel Horizon (queue dashboard) | http://localhost/horizon |
| MySQL | localhost:3306 |
| Redis | localhost:6379 |

---

## Default Admin Account

```
Email:    admin@4utest.gr
Password: admin4utest2024
```

> The admin account has `is_unlimited = true`, bypassing all subscription checks.

---

## Getting Started

### Prerequisites

- Docker + Docker Compose
- Node.js 18+

### Start the stack

```bash
# Start all containers (app, mysql, redis)
./vendor/bin/sail up -d

# Run database migrations
docker exec 4utest-laravel.test-1 php artisan migrate

# Start Horizon queue workers
docker exec 4utest-laravel.test-1 php artisan horizon

# Install JS dependencies and build assets
npm install
npm run build

# Or run the dev server with hot reload
npm run dev
```

### Run a scan

1. Log in at http://localhost
2. Click **New Scan** in the sidebar
3. Enter a website URL (e.g. `https://example.com`) and an optional name
4. Click **Run Audit** — six modules start in parallel
5. The page auto-refreshes every 3 seconds until all modules complete
6. View the health score, per-module results, and score deductions

---

## Audit Modules

### 1. SEO & Schema
Checks meta title/description length and status, H1 tags, canonical URL correctness, Open Graph tags, JSON-LD structured data, image alt text coverage, `robots.txt`, and `sitemap.xml`.

### 2. Security
Validates SSL certificate (validity, issuer, days remaining), HTTPS redirect, mixed content detection, and 6 HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Also audits DNS records: SPF, DMARC, DKIM.

### 3. Performance
Uses headless Chrome (Browsershot + Lighthouse) to measure TTFB, FCP, and LCP on desktop and mobile across up to 15 pages. Detects gzip/brotli compression and render-blocking resources.

### 4. Broken Resources
Crawls all internal pages (up to 60, 3.5-minute budget) and checks every link and image for HTTP 4xx/5xx errors. Reports counts and the first 20 broken URLs per category.

### 5. E-commerce Catalog
Finds product pages (up to 50, 3-minute budget) and checks each for: missing/malformed prices, stock availability mismatches between schema.org data and visible UI, and disabled add-to-cart buttons.

### 6. Marketing Tracking
Detects Google Analytics 4, Facebook Pixel, and TikTok Pixel across crawled pages. Also fetches the GTM container JavaScript to detect pixels configured inside Google Tag Manager.

---

## Health Score

Every completed scan scores 0–100. Deductions include:

| Issue | Penalty |
|---|---|
| Invalid/missing SSL | −20 |
| SSL expiring within 30 days | −10 |
| Mixed content detected | −10 |
| Most security headers missing | −10 |
| Slow TTFB (> 1500 ms) | −10 |
| Missing GA4 tracking | −5 |
| No SPF record | −5 |
| No DMARC record | −5 |
| Broken links found | −5 to −10 |
| Broken images found | −5 |
| … and more | … |

---

## Scheduled Scans

Set up automatic scans to run **hourly / daily / weekly / monthly**. Toggle on/off from the Scheduled Scans page. Enable **Email notification** to receive an email with the health score and a direct report link when each scheduled scan completes.

---

## Exports

From any completed audit report:
- **PDF** — formatted summary for client delivery
- **CSV** — raw data for further analysis

---

## Compare

From Scan History, select any two completed scans and click **Compare** for a side-by-side diff of all key metrics.

---

## Project Structure

```
app/
  Http/Controllers/
    SeoSchemaAuditController.php       # SEO module
    SecurityInfrastructureController.php # Security module
    PerformanceAuditController.php     # Performance module
    BrokenResourceController.php       # Broken resources module
    EcommerceCatalogAuditController.php # Catalog module
    TrackingAuditController.php        # Marketing tracking module
    FullAuditReportController.php      # Orchestrates all 6 modules
  Jobs/
    RunAuditorJob.php                  # Queue job for each module
    ProcessScheduledScan.php           # Runs scheduled scans
  Models/
    FullAuditReport.php
    ScheduledScan.php
    User.php
  Mail/
    ScanCompletedMail.php

resources/
  js/
    Pages/
      Dashboard.tsx
      Audits/Index.tsx
      Audits/Show.tsx
      Audits/Compare.tsx
      ScheduledScans/Index.tsx
      Profile/Edit.tsx
      Billing/Index.tsx
    i18n/
      en.ts                            # English translations
      el.ts                            # Greek translations
    Layouts/
      AppLayout.tsx                    # Main dark-theme layout
      GuestLayout.tsx                  # Auth pages layout
```

---

## Environment Variables (key ones)

```env
APP_URL=http://localhost

DB_HOST=mysql
DB_DATABASE=4utest
DB_USERNAME=sail
DB_PASSWORD=password

REDIS_HOST=redis

STRIPE_KEY=pk_...
STRIPE_SECRET=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

MAIL_MAILER=smtp
MAIL_FROM_ADDRESS=noreply@4utest.gr
```

---

## Queue Workers

All 6 audit modules run as queued jobs with a 600-second timeout. Start Horizon to process them:

```bash
docker exec 4utest-laravel.test-1 php artisan horizon
```

Monitor at http://localhost/horizon.

---

## License

Private / proprietary.
