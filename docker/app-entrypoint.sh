#!/bin/sh
set -e

BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/ms-playwright}"
mkdir -p "$BROWSERS_PATH"

chromium_present() {
  for d in \
    "$BROWSERS_PATH"/chromium-* \
    "$BROWSERS_PATH"/chromium_headless_shell-* \
    "$BROWSERS_PATH"/chrome-headless-shell-*
  do
    [ -d "$d" ] && return 0
  done
  return 1
}

if chromium_present; then
  echo "Playwright Chromium already present in volume; skipping download"
else
  echo "Installing Playwright Chromium into $BROWSERS_PATH..."
  npx playwright install chromium
fi

# Volume is root-owned on first create; Chromium must be runnable as nextjs (uid 1001)
owner="$(stat -c %u "$BROWSERS_PATH" 2>/dev/null || echo 0)"
if [ "$owner" != "1001" ]; then
  chown -R nextjs:nodejs "$BROWSERS_PATH"
fi

echo "Running prisma migrate deploy..."
gosu nextjs npx prisma migrate deploy
echo "Starting Next.js..."
exec gosu nextjs npx next start -H 0.0.0.0 -p 3000
