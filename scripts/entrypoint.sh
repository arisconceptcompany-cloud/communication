#!/bin/sh
set -e

cd /app

echo "→ Application du schéma base de données…"
npx prisma db push

if [ "${SKIP_SEED}" != "true" ]; then
  if [ -f /app/data/.seeded ]; then
    echo "→ Seed déjà effectué, ignoré."
  else
    echo "→ Initialisation des données (seed)…"
    if npx tsx prisma/seed.ts; then
      touch /app/data/.seeded
      echo "→ Seed terminé."
    else
      echo "⚠ Seed ignoré (peut être normal si données existantes)."
    fi
  fi
fi

echo "→ Démarrage du serveur Next.js…"
exec node server.js
