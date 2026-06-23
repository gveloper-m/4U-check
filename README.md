# 4uTest — Website Audit Platform

4uTest is a subscription SaaS platform that automatically audits websites and tells you exactly what is wrong with them. You paste a URL, the platform runs seven analysis modules in parallel, and within about 30 seconds you have a full health report with a score out of 100 and a precise list of every issue, what it costs you in points, and why it matters.

It is built for digital agencies, e-commerce businesses, and anyone who needs to monitor multiple websites on a recurring basis without paying a consultant to manually check things every month.

---

## What it does

### Audits

Every audit runs seven modules simultaneously on the target URL:

**SEO & Schema** — Checks the meta title and description (length, presence), H1 tags, canonical URL, Open Graph tags for social sharing, JSON-LD structured data, image alt text, robots.txt, and sitemap.xml. Everything search engines and social platforms need to correctly index and display the page.

**Security** — Checks the SSL certificate (validity, issuer, days until expiry), whether HTTP redirects to HTTPS, mixed content (HTTP assets on an HTTPS page), six critical HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type, Referrer-Policy, Permissions-Policy), and DNS email security records (SPF, DMARC).

**Performance** — Measures Time to First Byte (TTFB), checks whether Gzip or Brotli compression is enabled, identifies render-blocking scripts and stylesheets, and reports the overall page size and request count.

**Broken Resources** — Crawls all internal links and images on the page and tests each one for a working HTTP response. Reports total counts and broken percentages, and for each broken URL tells you which source page it was found on.

**E-commerce Catalog** — Detects product pages and checks for missing or malformed prices, stock status mismatches between structured data and the visible page, and disabled add-to-cart buttons.

**Marketing & Tracking** — Detects the presence of Google Analytics 4, Google Tag Manager, Facebook Pixel, TikTok Pixel, Google Ads conversion tracking, and Hotjar across crawled pages, including which pixel IDs are active.

**Accessibility (WCAG)** — Checks form labels, image alt text, ARIA attributes on interactive elements, heading hierarchy (H1 → H2 → H3 with no skips), landmark elements (`<main>`, skip nav), the HTML lang attribute, and colour contrast ratios.

### Health score

Every completed scan produces a score from 0 to 100. Issues deduct points — for example, a missing SSL certificate costs 20 points, a very slow server response costs 10, missing security headers cost 5–10 depending on severity. The score is colour-coded (green ≥70, amber ≥40, red below 40), and every deduction is listed so users know exactly what to fix first.

### Scheduled scans

Users can set up automatic scans on any site — hourly, daily, weekly, or monthly. When a scheduled scan completes, the platform emails the results including a full branded PDF report attached to the email. This means a business can wake up every Monday morning with an audit report already in their inbox.

### Scan history and comparison

Every audit is saved. Users can browse their full scan history, compare two or three scans side-by-side to track improvements over time, and export any report as a PDF or CSV.

### White-label sharing

Any report can be shared via a public link with a unique UUID — no login required, no 4uTest branding visible to the recipient. Agencies can send clients a clean report that looks like their own work.

### Agency branding

Users can upload their own logo and set their brand colours. The white-label shared reports and exported PDFs reflect the agency's identity, not 4uTest's.

### MCP Agent

Every plan includes a free MCP Agent — a lightweight Docker container the user deploys on the same server as their website. The agent connects Claude Code (Anthropic's AI coding assistant) to the server via the Model Context Protocol (MCP), giving Claude direct, live access to:

- **Server files** — Claude can read and edit files directly; no copy-pasting code snippets back and forth
- **Server health metrics** — real-time CPU, RAM, and disk usage so Claude understands the server context
- **Audit results** — the latest 4uTest scan is pushed to the agent automatically, so Claude knows exactly which issues exist and where
- **Automatic backups** — the agent creates a ZIP backup of the project before Claude makes any changes

With the agent running, a user can open Claude Code and say *"Check my latest 4uTest audit and fix the top security and SEO issues"* — and Claude will read the audit report, inspect the affected files on the live server, apply the fixes, and verify them, without the user doing anything manually.

**Deployment.** Users deploy the agent directly from their dashboard without touching the command line. They enter their server IP, SSH credentials, and project path, and the platform SSHes into the server and runs the full setup — pulling `4utest/mcp-agent:latest` from Docker Hub, creating the required directories, and starting the container. Only the `4utest-agent` container is ever touched; no other services on the server are affected. A manual single-command fallback is also shown for users who prefer it.

**Security.** The agent image is distributed via Docker Hub. The API base URL (`https://4utest.io`) is hardcoded inside the image and cannot be changed, so the agent can only communicate with 4utest.io and cannot be repurposed. Each agent authenticates with a unique per-site token generated on registration.

### Support tickets

A built-in support ticket system lets users open tickets and receive replies from the support team. All messages trigger email notifications in both directions. Tickets support photo attachments and full threaded conversation history.

### Blog

A public blog with admin-managed posts. The admin panel can generate blog post drafts using AI (Mistral) with keyword-relevant images auto-attached.

### Multi-language

The full interface, all email notifications, and all PDF exports are available in English, Greek, German, French, Spanish, Dutch, and Czech. Each user picks their preferred language from their profile.

### Subscription billing

Two plans: €19.99/month or €199.99/year (both exclusive of VAT). VAT is calculated automatically by Stripe based on the customer's billing country and VAT number. B2B customers in the EU with a valid VAT number get reverse charge (0% VAT). Payments, invoices, and subscription management all happen through Stripe — customers can update their card, download past invoices, or cancel directly from the Stripe billing portal without contacting support.

---

## Admin panel

The admin panel at `/admin` is only accessible to accounts with admin rights.

| Section | What it does |
|---|---|
| **Users** | Full user list with scan counts, plan, last activity. Per-user detail with 6-month activity chart, top audited sites, Stripe subscription data. Grant/revoke admin or unlimited access, add bonus scans, send a direct email. Export full user list as CSV. |
| **Tickets** | All support tickets across all users. Filter by status, read the full thread, reply, close or reopen. |
| **Blog** | Create, edit, and delete blog posts. AI draft generation from a topic keyword. |
| **Monitoring** | Live server health: RAM, CPU load, disk usage, uptime. Database and Redis ping times. Queue status (pending / failed jobs). Log viewer for the last 100 log entries, filterable by level. |
| **Trial codes** | Generate one-time trial codes to give specific users extended trial access. |

---

## Production: step-by-step

Everything below is what you need to do, in order, to go from a blank server to a live production deployment.

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
docker run --rm php:8.4-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
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

Create two products:

| Product name | Price | Billing period | Tax behaviour |
|---|---|---|---|
| 4uTest Pro Monthly | €19.99 | Monthly recurring | **Exclusive of tax** |
| 4uTest Pro Yearly | €199.99 | Yearly recurring | **Exclusive of tax** |

Setting "Exclusive of tax" means the price shown is before VAT — Stripe adds VAT on top based on the customer's country. This is the correct setup for EU compliance.

Copy the `price_...` ID from each product into `.env`:
```env
STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_YEARLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxxxx
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

This is the "Manage subscription" page where customers can update their card, download invoices, or cancel — without ever contacting you.

#### 5e. Enable VAT collection (recommended)

If you have customers in the EU, you should enable Stripe Tax so VAT is calculated and collected automatically:

1. Stripe dashboard → **Tax** → **Get started** → Enable Stripe Tax
2. Add your tax registration for each country you sell in (at minimum Greece at 24%)
3. Set in `.env`:
```env
STRIPE_TAX_ENABLED=true
```

When enabled, Stripe automatically applies the correct VAT rate based on billing country, gives 0% reverse charge to EU businesses with a valid VAT number, and includes all of this on the invoice it generates.

---

### 6. Set up Brevo for email

#### 6a. Create a Brevo account

Go to [brevo.com](https://brevo.com) and create a free account (300 emails/day free).

#### 6b. Verify your sender email address

In Brevo → **Senders & IPs** → **Senders** → Add a sender. Enter your from address (e.g. `noreply@yourdomain.com`) and verify it by clicking the link in the verification email.

For best deliverability, also verify your domain by adding the DNS records Brevo provides (DKIM and SPF). Brevo shows you exactly which DNS records to add.

#### 6c. Get your SMTP credentials

Brevo → **SMTP & API** → **SMTP** tab. Note down:
- SMTP server: `smtp-relay.brevo.com`
- Port: `587`
- Login: shown on the page (format: `xxxxxxx@smtp-brevo.com`)
- Password / Key: generate one on that page

#### 6d. Whitelist your server's IP

Brevo → **Senders & IPs** → **Dedicated IPs** or the general IP whitelist. Add your server's public IP address. Without this, Brevo rejects SMTP connections from your server.

To find your server's outbound IP:
```bash
curl -s https://api.ipify.org
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

This is only used for the AI blog post generation in the admin panel. The rest of the app works without it.

---

### 8. Obtain the SSL certificate (run once)

From your server, with DNS already pointing to it:

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

This script does everything: pulls the latest code, builds the Docker images, waits for MySQL to be healthy, runs database migrations, caches the Laravel config/routes/views, and starts all six containers (Nginx, PHP-FPM, Horizon, Scheduler, MySQL, Redis, Certbot).

At the end it prints the URL and shows container status.

---

### 10. Create the admin account

After deploy, create your admin user through the normal registration page at `https://yourdomain.com/register`, then promote it to admin via the database:

```bash
docker exec -it $(docker ps -qf "name=php-fpm") php artisan tinker

# Inside tinker — replace with your actual email:
\App\Models\User::where('email', 'you@yourdomain.com')
    ->update(['is_admin' => true, 'is_unlimited' => true]);
exit
```

`is_unlimited` means this account bypasses the subscription check — you can run audits without subscribing. `is_admin` gives access to the `/admin` panel.

---

### 11. Test everything

Work through this checklist after first deploy:

**App basics**
- [ ] `https://yourdomain.com` loads (green padlock in browser)
- [ ] Can register a new account
- [ ] Can log in

**Emails**
- [ ] Trigger a password reset — email arrives within 1–2 minutes
- [ ] Open a support ticket as a user — admin receives notification email
- [ ] Reply to the ticket as admin — user receives notification email

**Stripe**
- [ ] Use a Stripe test card (`4242 4242 4242 4242`) to subscribe to the monthly plan
- [ ] Stripe Checkout page opens correctly with VAT calculation
- [ ] After payment, subscription is active in the app's billing page
- [ ] "Manage subscription" button opens the Stripe billing portal

**Audits**
- [ ] Run a manual audit on any URL — completes within 60 seconds
- [ ] Score and all 7 module results appear
- [ ] Download the PDF export
- [ ] Enable sharing on an audit — share link opens without login and shows no 4uTest branding

**Scheduled scans**
- [ ] Create a scheduled scan with email notification enabled
- [ ] Click "Run now" to trigger it immediately
- [ ] Email with PDF attached arrives after scan completes (allow 1–2 minutes)

**Admin panel**
- [ ] `/admin/users` shows the user list
- [ ] `/admin/monitoring` shows server metrics and queue status with no failed jobs

---

### 12. Switch to Stripe live mode

The steps above used test keys. Once you have tested everything:

1. Go to Stripe dashboard → toggle from **Test mode** to **Live mode** (top left)
2. Repeat step 5a — create the same two products and prices in live mode
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

### Ongoing: how to deploy code updates

Every time you push code changes:

```bash
cd /var/www/4utest/app-deploy
./scripts/deploy.sh
```

That's it. The script pulls the latest code, rebuilds the images, migrates the database, recaches everything, and restarts containers.

---

### Useful commands

```bash
# View all running containers
docker compose -f /var/www/4utest/app-deploy/docker-compose.yml ps

# View live app logs
docker compose -f /var/www/4utest/app-deploy/docker-compose.yml logs -f php-fpm

# View queue worker logs
docker compose -f /var/www/4utest/app-deploy/docker-compose.yml logs -f horizon

# View failed audit jobs
docker compose exec php-fpm php artisan queue:failed

# Retry all failed jobs
docker compose exec php-fpm php artisan queue:retry all

# Run a tinker session (database queries, model inspection)
docker compose exec php-fpm php artisan tinker

# Manually clear all caches
docker compose exec php-fpm php artisan cache:clear
docker compose exec php-fpm php artisan view:clear
docker compose exec php-fpm php artisan config:clear
```

---

## License

Private / proprietary. All rights reserved.
