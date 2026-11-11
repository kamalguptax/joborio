#!/usr/bin/env bash
# Stop crash-loop, rebuild .next, start PM2 cleanly.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p logs

echo "==> Stop crash loop"
pm2 delete joborio-web 2>/dev/null || true

echo "==> Check Node"
node -v
npm -v

echo "==> Install + build (server mode, not dist)"
unset NEXT_OUTPUT_EXPORT || true
npm ci
npm run build

if [ ! -f .next/BUILD_ID ]; then
  echo "ERROR: .next/BUILD_ID missing. next start will crash."
  exit 1
fi
if [ ! -d .next/static/chunks ]; then
  echo "ERROR: .next/static/chunks missing."
  exit 1
fi

echo "==> Test next start once (10s)"
# Fail fast if port busy / build broken
set +e
npx next start -H 0.0.0.0 -p 3001 &
PID=$!
sleep 8
kill "$PID" 2>/dev/null
wait "$PID" 2>/dev/null
set -e

echo "==> Start PM2"
pm2 start ecosystem.config.js
pm2 save
pm2 status
echo ""
echo "If it crashes again, run:  pm2 logs joborio-web --err --lines 100"
