# ============================================================
# Stage 1: Build JavaScript / TypeScript frontend assets
# ============================================================
FROM node:20-bookworm-slim AS node-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY resources/ resources/
COPY public/ public/
COPY vite.config.js tailwind.config.js postcss.config.js tsconfig.json ./

RUN npm run build

# ============================================================
# Stage 2: Production PHP-FPM runtime
# ============================================================
FROM php:8.4-fpm-bookworm

LABEL maintainer="4uTest <admin@4utest.gr>"
LABEL description="4uTest Laravel backend - PHP 8.3 FPM with Chromium"

# Install system dependencies, Chromium and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Chromium for Browsershot performance audits
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
COPY composer.json composer.lock ./

# Install PHP production dependencies (no dev, optimised autoloader)
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-scripts \
    --no-interaction \
    --prefer-dist

# Copy full application source (respects .dockerignore)
COPY --chown=www-data:www-data . .

# Overwrite public/build with assets compiled in node-builder stage
COPY --from=node-builder --chown=www-data:www-data /app/public/build public/build/

# Copy custom PHP production settings
COPY deploy/backend/php.ini /usr/local/etc/php/conf.d/99-production.ini

# Copy and make entrypoint executable
COPY deploy/backend/entrypoint.sh /usr/local/bin/entrypoint.sh
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

# Chromium environment (auto-detected by PerformanceAuditController)
ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]
