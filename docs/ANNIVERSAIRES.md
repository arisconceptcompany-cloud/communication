# Module « Liste des employés » (RH / Admin)

## Accès

- Page : `/anniversaires` (intitulé « Liste des employés »)
- API : `/api/anniversaires` et `/api/anniversaires/[id]`
- Visible uniquement pour les rôles `RH` et `ADMIN`. Les collaborateurs sont redirigés vers l’accueil et reçoivent une réponse `403` sur l’API.
- La liste est affichée par **matricule croissant** (tri numérique naturel).

Les champs gérés sont :

| Champ | Description |
| --- | --- |
| `matricule` | Numéro de matricule (unique) |
| `fullName` | Nom & prénoms |
| `birthDate` | Date de naissance au format `AAAA-MM-JJ` |

## Données initiales

Les 147 enregistrements proviennent de `doc/ANNIVERSAIRE.xlsx`, feuille **Grande liste** (colonnes `N° Mle`, `Prénoms`, `Date de naissance`).

Ils ont été exportés dans `prisma/birthdays.json`, qui est la source utilisée par `prisma/seed.ts`. Le seed utilise un `upsert` par matricule : il est idempotent et n’efface pas les employés ajoutés manuellement depuis l’interface.

La version du seed a été mise à jour dans `prisma/SEED_VERSION` (`2026-11-27-anniversaires`) pour que les serveurs déjà installés reçoivent automatiquement les données au prochain démarrage.

## Administration

- Bouton **+ Ajouter** : création d’un employé.
- Bouton **Modifier** : mise à jour (matricule, nom, date).
- Bouton **Supprimer** : ouvre une popup de confirmation intégrée avant suppression.
- La recherche filtre par matricule ou par nom.

Les dates sont stockées comme des chaînes `AAAA-MM-JJ` : aucune conversion de timezone, donc aucun risque d’erreur d’hydratation React #418.

## Anniversaires du jour sur l’accueil

Le widget « 🎂 Anniversaires du jour » de la page d’accueil combine les comptes utilisateurs et la liste des employés. Seuls les noms sont affichés : ni matricule ni date complète ne sont exposés aux collaborateurs.

## Régénérer `birthdays.json`

Depuis la racine du projet, avec Python et `openpyxl` installés :

```bash
python3 - <<'PY'
import openpyxl, datetime, json, warnings
warnings.filterwarnings('ignore', category=UserWarning)
wb = openpyxl.load_workbook('doc/ANNIVERSAIRE.xlsx', data_only=True, read_only=True)
ws = wb['Grande liste']
records = []
for row in ws.iter_rows(min_row=3, values_only=True):
    mat, name, dob = row[0], row[1], row[2]
    if mat is None or name is None or dob is None or not isinstance(dob, (datetime.datetime, datetime.date)):
        continue
    matricule = str(mat).strip()
    full_name = ' '.join(str(name).split())
    if not matricule or not full_name:
        continue
    records.append({
        'matricule': matricule,
        'fullName': full_name,
        'birthDate': dob.date().isoformat() if isinstance(dob, datetime.datetime) else dob.isoformat(),
    })
with open('prisma/birthdays.json', 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)
    f.write('\n')
print(len(records), 'employés exportés')
PY
```
