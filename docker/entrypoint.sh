#!/bin/sh
set -e

echo "============================================"
echo " EduFlow CRM — Backend Startup"
echo "============================================"

DOTENV=/var/www/html/.env

# ── 0. Wipe any stale PHP bootstrap cache from the image build ───────────────
rm -f /var/www/html/bootstrap/cache/config.php
rm -f /var/www/html/bootstrap/cache/routes-v7.php
rm -f /var/www/html/bootstrap/cache/events.php
rm -f /var/www/html/bootstrap/cache/packages.php
echo "[entrypoint] Bootstrap cache cleared."

# ── 1. Generate APP_KEY + JWT_SECRET if not supplied ─────────────────────────
# Use openssl directly — avoids artisan bootstrap complexity and CRLF issues.
if [ -z "${APP_KEY}" ]; then
  APP_KEY="base64:$(openssl rand -base64 32)"
  echo "[entrypoint] APP_KEY generated."
fi

if [ -z "${JWT_SECRET}" ]; then
  JWT_SECRET="$(openssl rand -hex 64)"
  echo "[entrypoint] JWT_SECRET generated."
fi

# ── 2. Write a clean .env (Unix LF only) ─────────────────────────────────────
# Using printf + explicit \n avoids heredoc CRLF issues on Windows hosts.
printf '%s\n' \
  "APP_NAME=\"${APP_NAME:-EduFlow CRM}\"" \
  "APP_ENV=${APP_ENV:-production}" \
  "APP_KEY=${APP_KEY}" \
  "APP_DEBUG=${APP_DEBUG:-false}" \
  "APP_URL=${APP_URL:-http://localhost:8000}" \
  "" \
  "LOG_CHANNEL=stack" \
  "LOG_STACK=single" \
  "LOG_LEVEL=${LOG_LEVEL:-error}" \
  "" \
  "DB_CONNECTION=mysql" \
  "DB_HOST=${DB_HOST:-database}" \
  "DB_PORT=${DB_PORT:-3306}" \
  "DB_DATABASE=${DB_DATABASE:-eduflow}" \
  "DB_USERNAME=${DB_USERNAME:-eduflow_user}" \
  "DB_PASSWORD=${DB_PASSWORD:-eduflow_password}" \
  "" \
  "CACHE_STORE=${CACHE_STORE:-database}" \
  "QUEUE_CONNECTION=${QUEUE_CONNECTION:-sync}" \
  "SESSION_DRIVER=${SESSION_DRIVER:-database}" \
  "SESSION_LIFETIME=${SESSION_LIFETIME:-120}" \
  "SESSION_ENCRYPT=false" \
  "SESSION_PATH=/" \
  "SESSION_DOMAIN=null" \
  "" \
  "FILESYSTEM_DISK=local" \
  "" \
  "MAIL_MAILER=${MAIL_MAILER:-log}" \
  "MAIL_HOST=${MAIL_HOST:-127.0.0.1}" \
  "MAIL_PORT=${MAIL_PORT:-2525}" \
  "MAIL_USERNAME=${MAIL_USERNAME:-null}" \
  "MAIL_PASSWORD=${MAIL_PASSWORD:-null}" \
  "MAIL_ENCRYPTION=null" \
  "MAIL_FROM_ADDRESS=\"${MAIL_FROM_ADDRESS:-hello@eduflow.school}\"" \
  "MAIL_FROM_NAME=\"${MAIL_FROM_NAME:-EduFlow CRM}\"" \
  "" \
  "JWT_SECRET=${JWT_SECRET}" \
  "" \
  "BROADCAST_CONNECTION=log" \
  > "$DOTENV"

echo "[entrypoint] .env written."
echo "[entrypoint] APP_KEY  = ${APP_KEY}"
echo "[entrypoint] JWT_SECRET length = $(echo -n "${JWT_SECRET}" | wc -c) chars"

# ── 3. Wait for MySQL ─────────────────────────────────────────────────────────
echo "[entrypoint] Waiting for MySQL at ${DB_HOST:-database}:${DB_PORT:-3306}..."
until php -r "
try {
  new PDO(
    'mysql:host=${DB_HOST:-database};port=${DB_PORT:-3306};dbname=${DB_DATABASE:-eduflow}',
    '${DB_USERNAME:-eduflow_user}',
    '${DB_PASSWORD:-eduflow_password}',
    [PDO::ATTR_TIMEOUT => 3]
  );
  exit(0);
} catch (PDOException \$e) {
  exit(1);
}
"; do
  echo "[entrypoint] Database not ready — retrying in 3s..."
  sleep 3
done
echo "[entrypoint] Database is ready."

# ── 4. Run migrations ─────────────────────────────────────────────────────────
echo "[entrypoint] Running migrations..."
php artisan migrate --force
echo "[entrypoint] Migrations complete."

# ── 5. Optionally seed demo data ──────────────────────────────────────────────
if [ "${SEED_DATABASE:-false}" = "true" ]; then
  echo "[entrypoint] Seeding database..."
  php artisan db:seed --force
  echo "[entrypoint] Seeding complete."
fi

# ── 6. Cache config/routes/views with real secrets baked in ──────────────────
echo "[entrypoint] Warming caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo "[entrypoint] Caches warmed."

# ── 7. Verify JWT secret is in the config cache ────────────────────────────────
CACHED=$(php -r "
\$c = include '/var/www/html/bootstrap/cache/config.php';
echo isset(\$c['jwt']['secret']) && strlen(\$c['jwt']['secret']) > 0 ? 'OK' : 'MISSING';
")
echo "[entrypoint] JWT secret in config cache: ${CACHED}"
if [ "${CACHED}" != "OK" ]; then
  echo "[entrypoint] ERROR: JWT secret missing from config cache — aborting."
  exit 1
fi

# ── 8. Fix storage permissions ────────────────────────────────────────────────
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# ── 9. Start Apache ───────────────────────────────────────────────────────────
echo "[entrypoint] Starting Apache..."
exec apache2-foreground
