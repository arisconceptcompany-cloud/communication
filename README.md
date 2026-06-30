# Portail Intranet VALUE-IT

Portail interne pour ~150 collaborateurs Value-IT, auto-hébergeable sur serveur interne. Charte graphique alignée sur le [site corporate Value-IT](https://betav3-valueit.aris-cc.com/about/).

## Fonctionnalités

| Page | Accès | Description |
|------|--------|-------------|
| **Accueil** | Employés connectés | Fil d'actualité 3 colonnes (profil, annonces, chat) |
| **Organigramme** | Employés connectés | Structure hiérarchique |
| **Espace RH** | Employés connectés | Grand formulaire de communication vers les RH |
| **Hub interne** | **Anonyme** | Ressources + chat collaboratif sans authentification |
| **Boîte à idées** | **Anonyme** | Envoi vers emails configurés (`IDEA_BOX_RECIPIENTS`) |
| **Annonces** | **RH / Admin uniquement** | Formulaire libre de publication |

## Déploiement recommandé

### Option Contabo (VPS cloud)

Hébergement sur [Contabo](https://contabo.com/) avec HTTPS : voir **[docs/DEPLOIEMENT-CONTABO.md](docs/DEPLOIEMENT-CONTABO.md)** et `docker compose -f docker-compose.prod.yml up -d --build`.

### Option A — Docker (recommandé, local ou VPS Contabo)

Sur un VPS [Contabo](https://contabo.com/) : voir [docs/DEPLOIEMENT-CONTABO.md](docs/DEPLOIEMENT-CONTABO.md) et `scripts/deploy-contabo.sh`.

```bash
cp .env.example .env
# Éditer .env : AUTH_SECRET, SMTP, emails…

docker compose up -d --build
# Le seed initial est exécuté automatiquement au premier démarrage (entrypoint)
```

Accès : `http://intranet.value-it.local:3000` (voir [docs/URL-INTERNE.md](docs/URL-INTERNE.md))

```powershell
npm run setup:intranet   # hosts + pare-feu (admin)
npm run dev
```

### Option B — Node.js direct (Windows / Linux)

**Windows :** double-cliquez sur `Demarrer-Interface.bat` ou :

```powershell
npm run setup
npm run dev
```

**macOS / Linux :**

```bash
./scripts/demarrer.sh
```

**Production :**

```bash
npm run setup
npm run build
npm start
```

### Option C — Alternative Microsoft

Si votre infrastructure est déjà sur **Microsoft 365**, vous pouvez combiner :

- **SharePoint Online** pour documents + hub
- Ce portail en **complément** pour organigramme, boîte à idées anonyme et formulaires RH sur-mesure

Ou migrer progressivement vers **Azure App Service** + **Azure AD** (SSO) en remplaçant l’auth email/mot de passe actuelle.

## Sécurité réseau (interne uniquement)

1. Publier le portail **uniquement sur le réseau local** ou VPN (pare-feu : pas d’exposition Internet publique).
2. Restreindre par **IP interne** au reverse proxy (nginx / IIS / Traefik).
3. Optionnel : **Active Directory / LDAP** — contactez l’IT pour brancher `verifyCredentials` sur votre annuaire.
4. Domaines email autorisés : `ALLOWED_EMAIL_DOMAINS` dans `.env`.

## Comptes de démonstration (après `db:seed`)

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@value-it.mg | ValueIT2026! | Admin |
| rh@value-it.mg | ValueIT2026! | RH |
| employe@value-it.mg | ValueIT2026! | Employé |

**Changez ces mots de passe en production.**

## Configuration

Voir `.env.example` pour :

- `AUTH_SECRET` — clé JWT (32+ caractères)
- `IDEA_BOX_RECIPIENTS` — destinataires boîte à idées
- `SMTP_*` — envoi email des idées
- `ALLOWED_EMAIL_DOMAINS` — restriction @value-it.mg, etc.

## Capacité 150+ utilisateurs

- SQLite convient pour démarrer ; pour charge élevée, passer à **PostgreSQL** (`provider = "postgresql"` dans `prisma/schema.prisma`).
- Build **standalone** Next.js + un conteneur Docker : 2 Go RAM suffisent en général.
- Chat : polling 8 s ; pour temps réel, ajouter WebSockets plus tard.

## Stack

- Next.js 15, React 19, Prisma, SQLite
- Auth session JWT (cookie httpOnly)
- Nodemailer (boîte à idées)

## Support

Value-IT — Antananarivo · [value-it.mg](https://betav3-valueit.aris-cc.com/about/)
