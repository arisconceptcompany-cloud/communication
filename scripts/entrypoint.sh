#!/bin/sh
set -e

cd /app

echo "→ Application du schéma base de données…"
npx prisma db push

# Version des données de seed (prisma/SEED_VERSION). À incrémenter lorsqu'on
# modifie des données de référence (documents du Hub, etc.) afin que les
# serveurs existants les reçoivent au prochain démarrage.
SEED_VERSION_FILE=/app/data/.seed-version
WANT_SEED_VERSION="0"
if [ -f /app/prisma/SEED_VERSION ]; then
  WANT_SEED_VERSION="$(cat /app/prisma/SEED_VERSION)"
fi

CURRENT_SEED_VERSION=""
if [ -f "$SEED_VERSION_FILE" ]; then
  CURRENT_SEED_VERSION="$(cat "$SEED_VERSION_FILE")"
fi

if [ "${SKIP_SEED}" = "true" ]; then
  echo "→ Seed désactivé (SKIP_SEED=true), ignoré."
elif [ -f /app/data/.seeded ] && [ "$CURRENT_SEED_VERSION" = "$WANT_SEED_VERSION" ]; then
  echo "→ Seed déjà à jour (version $WANT_SEED_VERSION), ignoré."
else
  echo "→ Initialisation / mise à jour des données (seed version $WANT_SEED_VERSION)…"
  if npx tsx prisma/seed.ts; then
    touch /app/data/.seeded
    printf '%s' "$WANT_SEED_VERSION" > "$SEED_VERSION_FILE"
    echo "→ Seed terminé (version $WANT_SEED_VERSION)."
  else
    echo "⚠ Seed ignoré (peut être normal si données existantes)."
  fi
fi

echo "→ Démarrage du serveur Next.js…"
exec node server.js
