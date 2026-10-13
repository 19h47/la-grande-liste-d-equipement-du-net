# La Grande Liste d'équipement du Net

*The Great Net Equipment List*, version 4.0a (1997-1998), compilée par **Mark J. Carrasco** pour AD&D 2e édition : environ 3 000 prix d'objets, de services et de sorts, du tablier à 1 pc au lingot de Tellon à 5 000 000 po. Ce dépôt la rend en français et en JSON.

- **Texte** : l'original anglais et la traduction française complète, avec plus de 700 notes explicatives (`textes/`)
- **Données** : 3 039 objets bilingues avec prix convertis en pièces de cuivre (`data/items.json`, `data/items.csv`)
- **API statique** : servie par GitHub Pages depuis `docs/`, avec une page de recherche

## L'API

Fichiers JSON en lecture seule, sans serveur ni clé :

| Point d'accès | Contenu |
|---|---|
| `api/v1/index.json` | Métadonnées, crédits, unités |
| `api/v1/items.json` | Tous les objets |
| `api/v1/items/{id}.json` | Un objet (ex. `epee-longue`) |
| `api/v1/categories.json` | Les 33 tableaux |
| `api/v1/categories/{id}.json` | Un tableau et ses objets (ex. `taverne-et-auberge`) |
| `api/v1/currencies.json` | Pièces et lingots |
| `api/v1/search.json` | Index léger pour la recherche |

```json
{
 "id": "epee-longue",
 "category": "armes",
 "name": { "fr": "Épée longue", "en": "Long Sword" },
 "full_name": { "fr": "Épées — Épée longue", "en": "Sword — Long Sword" },
 "group": [ { "fr": "Épées", "en": "Sword" } ],
 "price": { "text": { "fr": "15 po", "en": "15gp" }, "min_cp": 1500, "max_cp": 1500, "plus": false },
 "weight": { "text": "4", "lb": 4 },
 "notes": { "fr": [] },
 "source": { "table": "XXXII", "line": 3716 }
}
```

- **Prix** : `min_cp` et `max_cp` sont en pièces de cuivre (1 pa = 10 pc, 1 pe = 50 pc, 1 po = 100 pc, 1 pp = 500 pc) ; `plus` signale un prix « à partir de » (`10+ pa`). Un prix non chiffrable (« Spécial », « Mort », chiffre sans unité dans l'original) a `min_cp: null`, mais son texte est toujours fourni.
- **Colonnes particulières** : les tableaux X et XII (œufs et petits) ont `eggs` et `young` au lieu de `price` ; le tableau XXIV (herbes) a `price_raw` et `price_prepared`.
- **Poids** : en livres (`lb`). « * » vaut 0,1 lb (dix objets pèsent une livre), « ** » vaut 0.
- **Groupes** : `group` donne la rubrique parente (« Ceinture » pour « Ceinture — Large »).
- **Source** : `source.line` renvoie à la ligne du fichier anglais original.

## Modifier les données

`data/items.json` est la source de vérité. Après une correction :

```sh
python3 scripts/build.py   # régénère data/items.csv et docs/api/v1/
```

## Mettre en ligne

Dans les réglages du dépôt sur GitHub, ouvrez **Pages**, puis choisissez la branche `main` et le dossier `/docs`.

## Crédits

- **Compilation originale** : Mark J. Carrasco (1997-1998), à partir de produits TSR (Gazetteers, Red Steel, Maztica, *Dungeoneer's Survival Guide*, DMG 1re et 2e éd., *Player's Option*, *Rules Cyclopedia*, *Dragon Magazine*, *Aurora's Whole Realms Catalogue*, *Complete Handbooks*, *Volo's Guides*) et de campagnes de joueurs.
- **Contributions** : Sarah Wright-Strutz, Windy Strawman, Ole A. Ringdal.
- **Version texte** : mise en forme par srm.
- **Herbes** : voir le *Net Book of Herbs* de Shaun Hately.
- **Traduction française, notes et données structurées** : 2026.

La notice de copyright originale est reproduite sans modification à la fin des deux fichiers texte. Ce projet de fans est non commercial et n'a aucun lien avec TSR ni Wizards of the Coast. *Advanced Dungeons & Dragons* et les univers cités sont leurs marques.

---

**English**: a French translation and a bilingual JSON dataset and static API of *The Great Net Equipment List* (v4.0a, AD&D 2e, 1997-98) by Mark J. Carrasco. Every string has `fr` and `en` fields, so the API is usable in English too. See the table above for endpoints.
