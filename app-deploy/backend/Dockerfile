# ============================================================
# Stage 1: Build JavaScript / TypeScript frontend assets
# ============================================================
FROM node:20-bookworm-slim AS node-builder

WORKDIR /app

COPY web-app/package*.json ./
RUN npm ci --legacy-peer-deps

COPY web-app/resources/ resources/
COPY web-app/public/ public/
COPY web-app/vite.config.js web-app/tailwind.config.js web-app/postcss.config.js web-app/tsconfig.json ./

RUN npm run build

# ============================================================
# Stage 2: Production PHP-FPM runtime
# ============================================================
FROM php:8.4-fpm-bookworm

LABEL maintainer="4uTest <admin@4utest.gr>"
LABEL description="4uTest Laravel backend - PHP 8.3 FPM with Chromium"

# Install system dependencies, Chromium and Node.js
#
# NOTE on chromium: we install the distro package purely for the shared
# libraries it pulls in (libnss3, libgtk, etc.) that any Chrome build needs
# at runtime. We do NOT run this binary directly — Debian bookworm's
# packaged chromium was found to crash on launch (SIGTRAP, immediately, no
# usable error) on this host's kernel. Browsershot instead drives Puppeteer's
# own downloaded Chrome-for-Testing build (see the `npm install puppeteer`
# step near the bottom of this file), which launches correctly.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    # Node.js runtime (used by Browsershot internals)
    nodejs \
    npm \
    # General utilities
    zip \
    unzip \
    curl \
    git \
    supervisor \
    # PHP extension build dependencies
    libzip-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libwebp-dev \
    libonig-dev \
    libxml2-dev \
    libicu-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        bcmath \
        gd \
        zip \
        intl \
        mbstring \
        xml \
        pcntl \
        opcache

# Install Redis PHP extension via PECL
RUN pecl install redis \
    && docker-php-ext-enable redis

# Install Composer 2
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer manifests first for layer-cache efficiency
COPY web-app/composer.json web-app/composer.lock ./

# Install PHP production dependencies (no dev, optimised autoloader)
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-scripts \
    --no-interaction \
    --prefer-dist

# Copy full application source (respects .dockerignore)
COPY --chown=www-data:www-data web-app/. .

# Remove any stale generated cache files that may have been copied in
RUN rm -f bootstrap/cache/packages.php bootstrap/cache/services.php

# Overwrite public/build with assets compiled in node-builder stage
COPY --from=node-builder --chown=www-data:www-data /app/public/build public/build/

# Inject MCP agent source so auto-deploy can SFTP-upload and build on user servers
COPY --chown=www-data:www-data 4u-test-agent/Dockerfile       resources/agent/Dockerfile
COPY --chown=www-data:www-data 4u-test-agent/requirements.txt resources/agent/requirements.txt
COPY --chown=www-data:www-data 4u-test-agent/server.py        resources/agent/server.py

# Copy custom PHP production settings
COPY app-deploy/backend/php.ini /usr/local/etc/php/conf.d/99-production.ini

# Copy and make entrypoint executable
COPY app-deploy/backend/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Run safe post-install Composer scripts
RUN composer run-script post-autoload-dump --no-interaction 2>/dev/null || true

# Create persistent storage skeleton (overridden by named volume at runtime –
# entrypoint recreates dirs inside the volume on first start)
RUN mkdir -p \
        storage/app/public \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Create public/storage symlink pointing at the named-volume path
RUN ln -sfn /var/www/html/storage/app/public public/storage

# Install the `puppeteer` npm package Browsershot's internal Node script
# requires at runtime, and let it download its own Chrome-for-Testing build
# (cached under /root/.cache/puppeteer) rather than skipping the download —
# see the note above on why we don't use the distro chromium binary.
# Installed directly by name — not via `npm ci` on the full package.json —
# since none of the frontend build tooling is needed here.
RUN npm install puppeteer@^23.0.0 --no-save --omit=dev --no-audit --no-fund --legacy-peer-deps

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]
