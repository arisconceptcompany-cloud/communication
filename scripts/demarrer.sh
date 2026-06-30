#!/bin/sh
set -e
cd "$(dirname "$0")/.."

echo "========================================"
echo "  Portail Intranet VALUE-IT"
echo "========================================"

if ! command -v npm >/dev/null 2>&1; then
  echo "Erreur : Node.js / npm requis (https://nodejs.org/)"
  exit 1
fi

[ -f .env ] || cp .env.example .env
mkdir -p data

[ -d node_modules ] || npm install

npx prisma generate
npm run db:push
npm run db:seed

echo ""
echo "Démarrage sur http://localhost:3000"
echo "Comptes démo : employe@value-it.mg / ValueIT2026!"
echo ""

(
  sleep 5
  if command -v open >/dev/null 2>&1; then
    open "http://localhost:3000/login"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000/login"
  fi
) &

npm run dev
