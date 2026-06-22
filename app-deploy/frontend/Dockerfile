# ============================================================
# Stage 1: Build JavaScript / TypeScript assets
# ============================================================
FROM node:20-bookworm-slim AS node-builder

WORKDIR /app

# Install dependencies first for layer caching
COPY web-app/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source files needed for the build
COPY web-app/resources/ resources/
COPY web-app/public/ public/
COPY web-app/vite.config.js web-app/tailwind.config.js web-app/postcss.config.js web-app/tsconfig.json ./

RUN npm run build

# ============================================================
# Stage 2: Nginx production image
# ============================================================
FROM nginx:1.27-alpine

LABEL maintainer="4uTest <admin@4utest.gr>"
LABEL description="4uTest Nginx frontend – serves static assets & proxies PHP to php-fpm"

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx main config
COPY app-deploy/frontend/nginx/nginx.conf /etc/nginx/nginx.conf

# Copy site template (processed at container start via nginx's envsubst entrypoint)
COPY app-deploy/frontend/nginx/templates/ /etc/nginx/templates/

# Copy the compiled public directory (static assets + entry points)
# Nginx serves these directly; PHP requests are proxied to php-fpm
COPY --from=node-builder /app/public /var/www/html/public

EXPOSE 80 443
