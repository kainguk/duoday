#!/usr/bin/env sh
set -e

mkdir -p "$(dirname "$DB_PATH")" "$UPLOAD_DIR"

# Run migrations + seed using the full node_modules (standalone output is too lean)
echo "[duoday] running migrate + seed (idempotent)…"
NODE_PATH=/app/_full_modules node \
  /app/_full_modules/.bin/tsx /app/scripts/migrate.ts || true
NODE_PATH=/app/_full_modules node \
  /app/_full_modules/.bin/tsx /app/scripts/seed.ts || true

echo "[duoday] starting server on :$PORT"
exec "$@"
