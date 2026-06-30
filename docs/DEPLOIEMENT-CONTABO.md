# Déploiement sur Contabo (VPS)

Contabo fournit un **VPS Linux** — pas d’hébergement PHP mutualisé. Le portail VALUE-IT tourne en **Docker** (déjà prévu dans le projet).

## 1. Commander le VPS

1. [contabo.com/en/vps/](https://contabo.com/en/vps/) — **Cloud VPS 10** suffit (4 vCPU, 8 Go RAM).
2. Image : **Ubuntu 22.04** (ou 24.04).
3. Région : la plus proche (ex. EU si utilisateurs à Madagascar via bon peering).
4. Panneau client : [my.contabo.com](https://my.contabo.com/) — noter l’**IP publique** et le mot de passe root.

## 2. Copier le projet sur le serveur

Depuis votre PC Windows (PowerShell) :

```powershell
scp -r "C:\Users\KIM\OneDrive\ComIntValue-it" root@VOTRE_IP:/opt/valueit-intranet
```

Ou avec Git sur le VPS :

```bash
git clone <url-du-repo> /opt/valueit-intranet
```

## 3. Installer et lancer (sur le VPS)

```bash
ssh root@VOTRE_IP
cd /opt/valueit-intranet
cp .env.example .env
nano .env   # AUTH_SECRET, APP_URL=https://intranet.votredomaine.com, SMTP…
bash scripts/deploy-contabo.sh
```

Après la première passe, éditez `.env` puis :

```bash
docker compose up -d --build
docker compose exec intranet npx tsx prisma/seed.ts
```

## 4. HTTPS avec Nginx (recommandé)

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Fichier `/etc/nginx/sites-available/intranet` :

```nginx
server {
    listen 80;
    server_name intranet.votredomaine.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/intranet /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d intranet.votredomaine.com
```

Dans `.env` : `APP_URL="https://intranet.votredomaine.com"`

## 5. Sécurité (intranet entreprise)

- **VPN ou pare-feu** : limiter l’accès aux IP du bureau (`ufw allow from 203.0.113.0/24 to any port 443`).
- Changer les mots de passe du seed en production.
- Ne pas exposer le port **3000** publiquement (uniquement via Nginx en 443).

## 6. Vérification

```bash
curl -I http://127.0.0.1:3000/login
docker compose logs -f intranet
```

Accès : `https://intranet.votredomaine.com/login`
