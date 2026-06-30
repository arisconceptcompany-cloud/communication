#!/bin/sh
set -e
cd "$(dirname "$0")/.."

if [ ! -f .next/standalone/server.js ]; then
  echo "Build manquant. Lancez : npm run build"
  exit 1
fi

mkdir -p data public/uploads/chat

mkdir -p .next/standalone/public
cp -r public/* .next/standalone/public/

mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static

cp -f .env .next/standalone/.env 2>/dev/null || true

export HOSTNAME="0.0.0.0"
export PORT="${PORT:-3000}"

cd .next/standalone
exec node server.js
