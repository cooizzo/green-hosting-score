#!/bin/sh
set -e
echo "Running prisma migrate deploy..."
npx prisma migrate deploy
echo "Starting Next.js..."
exec npx next start -H 0.0.0.0 -p 3000
