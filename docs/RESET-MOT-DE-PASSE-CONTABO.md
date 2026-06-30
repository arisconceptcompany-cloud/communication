# Réinitialiser le mot de passe root (VPS Contabo)

**Serveur :** `167.86.118.96` — utilisateur `root`

## Situation actuelle

Une **réinstallation Ubuntu** est en cours sur Contabo. Tant qu’elle n’est pas terminée :

- **Password reset** peut échouer (« error while processing your request »).
- Ne pas redémarrer ni arrêter le VPS.

## Méthode 1 — Après la réinstallation (recommandé)

1. Attendre l’email Contabo **« Your VPS is ready »** ou **« Initial Login Credentials »**.
2. Le mot de passe **root** s’y trouve.
3. Connexion : `ssh root@167.86.118.96`

## Méthode 2 — Password reset (panneau)

Quand la réinstallation est **terminée** :

1. [my.contabo.com](https://my.contabo.com/) → **VPS control**
2. Colonne **Manage** (icône engrenage) sur la ligne `167.86.118.96`
3. **Password reset**
4. Choisir un nouveau mot de passe (ou générer)
5. **Reset credentials** → attendre 2–5 minutes
6. Tester : `ssh root@167.86.118.96`

## Méthode 3 — Nouveau panneau Contabo

1. Bouton **Go to new.contabo.com**
2. **Servers & Hosting** → **VPS**
3. Menu **⋮** sur le serveur → **Reset credentials**

## Méthode 4 — Définir le mot de passe lors d’une réinstall

1. **VPS control** → icône **Reinstall**
2. Image : **Ubuntu 24.04 (LTS)**
3. Champ **mot de passe root** : saisir votre nouveau mot de passe
4. **Install** (efface toutes les données)

## Déployer l’intranet ensuite

```text
Lancer-Deploiement-Contabo.bat
```

(saisir le **nouveau** mot de passe root)

## Mot de passe compte Contabo (site web)

Si vous parlez du login **my.contabo.com** (pas du VPS) :

- Page de connexion → **Forgot password?**
- Ou : [contabo.com](https://contabo.com/) → support client
