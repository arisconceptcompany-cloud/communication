#!/bin/bash
# Déploiement intranet VALUE-IT sur VPS Contabo (Ubuntu 22.04+)
# Usage sur le serveur : curl -sL ... | bash   OU   scp + bash scripts/deploy-contabo.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/valueit-intranet}"
REPO_URL="${REPO_URL:-}"  # optionnel : git clone si défini

echo "=== VALUE-IT Intranet — installation Contabo ==="

if [ "$(id -u)" -ne 0 ]; then
  echo "Exécutez en root : sudo bash $0"
  exit 1
fi

apt-get update -qq
apt-get install -y -qq ca-certificates curl git ufw

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y -qq docker-compose-plugin
fi

mkdir -p "$APP_DIR"
if [ -n "$REPO_URL" ]; then
  git clone "$REPO_URL" "$APP_DIR" 2>/dev/null || (cd "$APP_DIR" && git pull)
else
  echo "Copiez le projet dans $APP_DIR (scp/rsync) si ce n'est pas déjà fait."
fi

cd "$APP_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  SECRET=$(openssl rand -base64 32 | tr -d '/+=' | head -c 40)
  sed -i "s|changez-moi-en-production-32-caracteres-min|$SECRET|" .env
  echo ""
  echo ">>> Éditez $APP_DIR/.env (APP_URL, SMTP, IDEA_BOX_RECIPIENTS)"
  echo ">>> Puis relancez : cd $APP_DIR && docker compose up -d --build"
  exit 0
fi

docker compose up -d --build
sleep 5
docker compose exec -T intranet npx tsx prisma/seed.ts || true

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true

echo ""
echo "=== Portail démarré sur le port 3000 ==="
echo "Configurez nginx + Let's Encrypt (voir docs/DEPLOIEMENT-CONTABO.md)"
echo "Test : curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/login"
