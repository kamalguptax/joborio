#!/usr/bin/env bash
# Run on VPS: bash scripts/check-next-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== PM2 ==="
pm2 status || true

echo ""
echo "=== .next present? ==="
if [ ! -f .next/BUILD_ID ]; then
  echo "MISSING .next/BUILD_ID — run: npm run build"
  exit 1
fi
echo "BUILD_ID=$(cat .next/BUILD_ID)"
echo "chunk css count: $(find .next/static/chunks -name '*.css' 2>/dev/null | wc -l)"
echo "chunk js count:  $(find .next/static/chunks -name '*.js' 2>/dev/null | wc -l)"
echo "sample css:"
ls -1 .next/static/chunks/*.css 2>/dev/null | head -5 || echo "(none)"

echo ""
echo "=== Does HTML ask for files that exist? ==="
# Prefer built HTML if present
HTML=""
if [ -f .next/server/app/index.html ]; then
  HTML=.next/server/app/index.html
elif [ -f .next/server/pages/index.html ]; then
  HTML=.next/server/pages/index.html
fi

if [ -n "$HTML" ]; then
  echo "Checking $HTML"
  grep -oE '/_next/static/chunks/[^" ]+\.css' "$HTML" | sort -u | while read -r path; do
    file=".next/static/chunks/$(basename "$path")"
    if [ -f "$file" ]; then echo "OK  $path"; else echo "MISS $path"; fi
  done
else
  echo "No prerendered index.html found in .next (ok for some builds)."
fi

echo ""
echo "=== Local curl (must be 200 while PM2 is online) ==="
for f in $(ls -1 .next/static/chunks/*.css 2>/dev/null | head -2); do
  name=$(basename "$f")
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3001/_next/static/chunks/$name" || echo err)
  echo "http://127.0.0.1:3001/_next/static/chunks/$name -> $code"
done
