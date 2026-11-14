#!/usr/bin/env bash
# Run on the VPS inside the frontend app directory.
# Fixes missing CSS/JS after a partial upload (PM2 + next start).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installing deps"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> Building Next.js server bundle (.next) — not static dist"
unset NEXT_OUTPUT_EXPORT || true
export NODE_ENV=production
npm run build

if [ ! -d .next/static/chunks ]; then
  echo "ERROR: .next/static/chunks missing after build. Aborting."
  exit 1
fi

echo "==> Restarting PM2"
if pm2 describe joborio-web >/dev/null 2>&1; then
  pm2 startOrReload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

echo ""
echo "Done. Verify a CSS file exists, e.g.:"
ls -1 .next/static/chunks/*.css | head -5
echo ""
echo "Then purge Cloudflare cache for joborio.com and hard-refresh the browser."
