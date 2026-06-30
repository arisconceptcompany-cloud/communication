# URL interne : http://intranet.value-it.local:3000

## Sur le serveur (votre PC qui héberge le portail)

1. Ouvrir **PowerShell en administrateur**
2. Exécuter :

```powershell
cd "C:\Users\KIM\OneDrive\ComIntValue-it"
npm run setup:intranet
npm run dev
```

3. Ouvrir dans le navigateur : **http://intranet.value-it.local:3000**

## Partager avec les collègues (même réseau bureau / VPN)

Chaque collègue doit résoudre `intranet.value-it.local` vers l’IP du serveur.

**Recommandé (150 utilisateurs)** — demander à l’IT un enregistrement DNS :

| Type | Nom | Valeur |
|------|-----|--------|
| A | `intranet.value-it.local` | IP du serveur (ex. `10.3.87.215`) |

**Alternative rapide** — sur chaque PC, en admin :

```powershell
cd "C:\Users\KIM\OneDrive\ComIntValue-it"
.\scripts\setup-intranet.ps1 -ClientOnly -ServerIP 10.3.87.215
```

(Remplacez par l’IP affichée par `npm run setup:intranet`.)

## Lien à envoyer

```
http://intranet.value-it.local:3000
```

- Sans connexion : `/hub`, `/idees`
- Connexion : `/login` (ex. rh@value-it.mg)

## Hors réseau entreprise

Cette URL ne fonctionne pas sur Internet sans **VPN** ou tunnel. Ne pas exposer le port 3000 directement sur le web en production.
