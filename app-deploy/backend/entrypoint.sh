#!/bin/bash
set -e

# ---------------------------------------------------------------------------
# Ensure the named-volume storage paths exist on first container run.
# The volume mount hides what was baked into the image, so we recreate the
# directory skeleton here.  This is idempotent – safe on every restart.
# ---------------------------------------------------------------------------
mkdir -p \
    /var/www/html/storage/app/public \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache

chown -R www-data:www-data \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache

chmod -R 775 \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache

# Regenerate package discovery cache so a stale volume never loads wrong providers
su -s /bin/sh www-data -c "php /var/www/html/artisan package:discover --ansi 2>&1 || true"

exec "$@"
