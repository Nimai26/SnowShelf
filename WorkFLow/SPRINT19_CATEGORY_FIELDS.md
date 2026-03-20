# 🏗️ Sprint 19 : Champs EAV par catégorie (Category Fields)

> **Objectif** : Permettre de définir des champs de métadonnées spécifiques à une catégorie,
> en complément des champs du type primaire (PrimaryType).
>
> **Date de création** : 13 mars 2026
> **Dernière mise à jour** : 13 mars 2026
> **Statut** : 🔄 En cours de conception

---

## 📋 Contexte & Problème

### Situation actuelle

```
Category (ex: "Lorcana")
    └── primaryTypeId → PrimaryType (trading_cards)
                            └── PrimaryTypeFields [game, rarity, set_name, card_number, year, language, graded, grade_value]
```

**Tous les items trading_cards partagent les mêmes 8 champs**, quel que soit le jeu (Pokémon, Lorcana, MTG, Yu-Gi-Oh...).

Or Lorcana a des champs spécifiques : `color`, `cost`, `strength`, `willpower`, `lore`, `inkwell`, `story`, `artist`, `version`, `subtypes`.
Pokémon a : `hp`, `stage`, `retreatCost`, `types`, `weaknesses`.
MTG a : `mana_cost`, `power`, `toughness`, `colors`, `cmc`.

Si on ajoute tous ces champs au type `trading_cards`, un utilisateur qui crée une carte Pokémon voit `willpower`, `lore`, `inkwell` — sans aucun sens.

### Solution retenue : Champs EAV par catégorie (Solution A)

```
Item.metadata = PrimaryTypeFields (communs) + CategoryFields (spécifiques à la catégorie)
```

```
Category "Lorcana" (is_default=true, primaryType=trading_cards)
    ├── Hérite de PrimaryType.fields : [game, rarity, set_name, card_number, year, language, graded, grade_value]
    └── CategoryFields propres    :  [color, cost, strength, willpower, lore, inkwell, story, artist, version, subtypes]
```

### Contraintes de design

1. **Catégories par défaut uniquement** — seules les catégories `is_default=true` peuvent avoir des champs personnalisés
2. **Admin only** — le CRUD des champs catégorie est réservé aux administrateurs
3. **Items many-to-many** — un item peut appartenir à N catégories → il voit l'union des champs de toutes ses catégories
4. **Rétrocompatible** — les items existants et l'import Tako doivent continuer à fonctionner
5. **Pas de collision de field_key** — si un même `field_key` existe dans le PrimaryType ET la catégorie, le champ type a la priorité

---

## 🏛️ Architecture

### Nouvelles entités

#### Table `category_fields` (miroir de `primary_type_fields`)

```sql
CREATE TABLE category_fields (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id      INT UNSIGNED NOT NULL,
  field_key        VARCHAR(50) NOT NULL,
  field_name_fr    VARCHAR(100) NOT NULL,
  field_name_en    VARCHAR(100) NOT NULL,
  field_type       ENUM('text','textarea','number','year','date','select','multiselect','url','rating','duration','boolean') NOT NULL DEFAULT 'text',
  field_options    TEXT DEFAULT NULL,        -- JSON pour select/multiselect
  placeholder_fr   VARCHAR(200) DEFAULT NULL,
  placeholder_en   VARCHAR(200) DEFAULT NULL,
  help_text_fr     TEXT DEFAULT NULL,
  help_text_en     TEXT DEFAULT NULL,
  icon             VARCHAR(10) DEFAULT NULL,
  is_required      TINYINT NOT NULL DEFAULT 0,
  is_searchable    TINYINT NOT NULL DEFAULT 1,
  is_filterable    TINYINT NOT NULL DEFAULT 1,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

  CONSTRAINT fk_catfield_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE INDEX unique_category_field (category_id, field_key),
  INDEX idx_catfield_category (category_id),
  INDEX idx_catfield_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table `item_category_metadata` (miroir de `item_metadata`)

```sql
CREATE TABLE item_category_metadata (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id          INT UNSIGNED NOT NULL,
  field_id         INT UNSIGNED NOT NULL,  -- FK → category_fields.id
  value_text       TEXT DEFAULT NULL,
  value_number     DECIMAL(15,2) DEFAULT NULL,
  value_date       DATE DEFAULT NULL,
  value_json       TEXT DEFAULT NULL,       -- JSON pour multiselect
  created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

  CONSTRAINT fk_icm_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_icm_field FOREIGN KEY (field_id) REFERENCES category_fields(id) ON DELETE CASCADE,
  UNIQUE INDEX unique_item_catfield (item_id, field_id),
  INDEX idx_icm_item (item_id),
  INDEX idx_icm_field (field_id),
  INDEX idx_icm_valuetext (value_text(255)),
  INDEX idx_icm_valuenumber (value_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Schéma relationnel complet

```
┌─────────────────┐       ┌──────────────┐       ┌───────────────────┐
│   categories    │──FK──▶│ primary_types │◀──FK──│ primary_type_fields│
│                 │       │              │       │                   │
│ primaryTypeId   │       └──────────────┘       └─────────┬─────────┘
│ is_default=true │                                        │
│                 │                                        ▼
│     ┌───────────┤                              ┌─────────────────┐
│     │           │                              │  item_metadata   │
│     ▼           │                              │ (champs type)    │
│ ┌───────────┐   │                              │ item_id, field_id│
│ │ category_ │   │                              └─────────────────┘
│ │ fields    │   │                                        ▲
│ │           │   │                                        │
│ │ category_id   │       ┌──────────┐                     │
│ │ field_key │   │       │  items   │─────────────────────┘
│ │ field_type│   │       │          │
│ └─────┬─────┘   │       │ primaryTypeId
│       │         │       │          │
│       ▼         │       │     ┌────┘
│ ┌────────────┐  │       │     ▼
│ │ item_cat_  │  │       │ ┌────────────────────┐
│ │ metadata   │◀─┼───────│ │ item_category_     │
│ │            │  │       │ │ metadata            │
│ │ item_id    │  │       │ │ (champs catégorie)  │
│ │ field_id ──┘  │       │ │ item_id, field_id   │
│ └────────────┘  │       │ └────────────────────┘
│                 │       │
│    ManyToMany ──┼───────┤ item_categories (join)
└─────────────────┘       └──────────┘
```

### Flux de données dans le formulaire item

```
1. Utilisateur ouvre ItemFormPage
2. Sélectionne un primaryType → charge les PrimaryTypeFields (existant)
3. Sélectionne une ou plusieurs categories via item_categories
4. ★ NOUVEAU : Pour chaque catégorie is_default=true sélectionnée → charge ses CategoryFields
5. Affiche : [PrimaryTypeFields] + [CategoryFields de toutes les catégories de l'item]
6. Enregistrement : metadata{} → saveMetadata (type) + saveCategoryMetadata (catégorie)
```

---

## 📝 Plan de développement

### Phase 1 — Backend : Entités & Migration (foundation)

- [ ] **1.1** Créer l'entité `CategoryField` (backend/src/database/entities/category-field.entity.ts)
  - Même structure que PrimaryTypeField mais avec `categoryId` au lieu de `primaryTypeId`
  - Relation `@ManyToOne(() => Category)` avec `CASCADE` on delete
  - Index unique `(category_id, field_key)`
- [ ] **1.2** Créer l'entité `ItemCategoryMetadata` (backend/src/database/entities/item-category-metadata.entity.ts)
  - Même structure que ItemMetadata mais `fieldId` → `CategoryField`
  - Relation `@ManyToOne(() => Item)` avec `CASCADE`
  - Relation `@ManyToOne(() => CategoryField)` avec `CASCADE`
- [ ] **1.3** Mettre à jour l'entité `Category`
  - Ajouter `@OneToMany(() => CategoryField, f => f.category, { cascade: true })` fields
- [ ] **1.4** Mettre à jour l'entité `Item`
  - Ajouter `@OneToMany(() => ItemCategoryMetadata, m => m.item, { cascade: true })` categoryMetadata
- [ ] **1.5** Enregistrer les entités dans AppModule (TypeORM forRoot entities array)
- [ ] **1.6** Vérifier que `synchronize: true` crée les tables automatiquement au démarrage

### Phase 2 — Backend : CRUD Admin des champs catégorie

- [ ] **2.1** Créer le module `CategoryFieldsModule` (ou intégrer dans `CategoriesModule`)
  - Service : `CategoryFieldsService` avec CRUD complet
  - Vérification `is_default=true` avant toute opération sur les champs
- [ ] **2.2** Endpoints admin (dans `CategoriesController` ou nouveau controller) :
  - `GET  /categories/:id/admin-fields` — liste les champs de la catégorie (admin)
  - `GET  /categories/fields/:fieldId/admin` — détail d'un champ (admin)
  - `POST /categories/fields` — créer un champ { categoryId, fieldKey, ... } (admin)
  - `PUT  /categories/fields/:fieldId` — modifier un champ (admin)
  - `DELETE /categories/fields/:fieldId` — supprimer un champ (admin, cascade metadata)
  - `PUT  /categories/:id/reorder-fields` — réordonner les champs (admin)
- [ ] **2.3** Endpoint public :
  - `GET /categories/:id/fields` — retourne les champs de la catégorie (triés par sortOrder, localisés)
    - Utilisé par le frontend pour charger dynamiquement les champs quand une catégorie est sélectionnée
- [ ] **2.4** DTO : `CreateCategoryFieldDto`, `UpdateCategoryFieldDto`, `ReorderCategoryFieldsDto`

### Phase 3 — Backend : Sauvegarde / Chargement des métadonnées catégorie

- [ ] **3.1** Modifier `items.service.ts` :
  - `saveCategoryMetadata(itemId, categoryIds, categoryMetadata)` — nouvelle méthode
    - Charge les `CategoryField` pour les catégories de l'item
    - Même logique de dispatch que `saveMetadata` (valueText/Number/Date/Json)
  - `create()` : après `saveMetadata`, appeler `saveCategoryMetadata` si `dto.categoryMetadata`
  - `update()` : delete + recreate `ItemCategoryMetadata` puis `saveCategoryMetadata`
- [ ] **3.2** Modifier `findOne()` : charger `categoryMetadata` + `categoryMetadata.field` dans les relations
- [ ] **3.3** Modifier `serializeItem()` : fusionner `metadata` (type) et `categoryMetadata` (catégorie) dans la réponse
  - Option A : deux objets séparés `metadata` + `categoryMetadata`
  - Option B : un seul objet `metadata` fusionné (plus simple pour le frontend)
  - **Retenu : Option A** — séparation claire backend, fusion au frontend
- [ ] **3.4** Modifier DTO `CreateItemDto` / `UpdateItemDto` : ajouter champ optionnel `categoryMetadata?: Record<string, any>`

### Phase 4 — Frontend : Affichage des champs catégorie dans ItemFormPage

- [ ] **4.1** Créer `categoryFieldService` (ou étendre `categoryService`) :
  - `getFieldsByCategoryId(categoryId: number)` → GET `/categories/:id/fields`
- [ ] **4.2** Modifier `ItemFormPage` :
  - Quand les catégories changent → charger les CategoryFields pour chaque catégorie par défaut
  - Fusionner avec les PrimaryTypeFields pour le rendu (avec séparateur visuel)
  - State `categoryMetadata: Record<string, any>` séparé de `metadata`
  - Soumission : envoyer `metadata` + `categoryMetadata` séparément
- [ ] **4.3** Affichage :
  - Section "Métadonnées" existante → champs du PrimaryType
  - ★ Nouvelle section "Champs catégorie" ou sous-section par catégorie
  - Même rendu dynamique (select, multiselect, boolean, text, number, etc.)
- [ ] **4.4** Modifier `ItemDetailPage` : afficher les categoryMetadata dans la section métadonnées

### Phase 5 — Frontend : Gestion admin des champs dans CategoryFormPage

- [ ] **5.1** Modifier `CategoryFormPage` :
  - Nouvel onglet / section "Champs personnalisés" (visible uniquement si `is_default=true` et user admin)
  - Liste des champs existants (drag & drop réordonnement)
  - Formulaire d'ajout / édition de champ (modal ou inline)
  - Suppression avec confirmation
- [ ] **5.2** Composant `CategoryFieldEditor` (réutiliser la logique admin PrimaryType si possible)
  - Formulaire : fieldKey, nameFr, nameEn, fieldType, options, required, searchable, filterable
  - Preview en temps réel du champ
- [ ] **5.3** Intégration admin panel : lien vers la gestion des champs catégorie

### Phase 6 — Import Tako : Mapping champs catégorie

- [ ] **6.1** Modifier `TAKO_FIELD_MAPPING` dans `tako.service.ts` :
  - Nouveau mapping par catégorie (ou par provider+domain) : `TAKO_CATEGORY_FIELD_MAPPING`
  - Ex : `{ lorcana: { story: 'story', color: 'color', cost: 'cost', ... } }`
- [ ] **6.2** Modifier le endpoint `getDomainMapping` :
  - Retourner aussi les `categoryFieldMappings` pour le frontend
- [ ] **6.3** Modifier `prepareTakoImport` dans `ItemFormPage.tsx` :
  - Après le mapping type → EAV, appliquer le mapping catégorie → CategoryField
  - Les champs catégorie apparaissent dans la preview d'import (section séparée ou fusionnée)
- [ ] **6.4** Modifier `confirmTakoImport` :
  - Envoyer les `categoryMetadata` en plus des `metadata` lors de la création/update

### Phase 7 — Seed des champs Lorcana (cas d'usage initial)

- [ ] **7.1** Créer un seed `CategoryFieldSeedService` :
  - Catégorie "Lorcana" (id=15) → champs :

  | field_key     | type        | name_fr              | name_en              | options                                           |
  |---------------|-------------|----------------------|----------------------|---------------------------------------------------|
  | artist        | text        | Illustrateur         | Artist               |                                                   |
  | color         | select      | Encre (Couleur)      | Ink (Color)          | ["Ambre","Améthyste","Émeraude","Rubis","Saphir","Acier"] |
  | cost          | number      | Coût d'encre         | Ink Cost             |                                                   |
  | strength      | number      | Force                | Strength             |                                                   |
  | willpower     | number      | Volonté              | Willpower            |                                                   |
  | lore          | number      | Lore                 | Lore                 |                                                   |
  | inkwell       | boolean     | Peut produire encre  | Can produce ink      |                                                   |
  | story         | text        | Franchise / Histoire | Story / Franchise    |                                                   |
  | version       | text        | Version / Sous-titre | Version / Subtitle   |                                                   |
  | subtypes      | multiselect | Sous-types           | Subtypes             | ["Storyborn","Dreamborn","Floodborn","Hero","Villain","Prince","Princess","Queen","King","Sorcerer","Fairy","Pirate","Inventor","Detective","Captain","Alien","Hyena","Musketeer","Knight","Seven Dwarfs","Tigger","Broom"] |
  | foil_types    | multiselect | Types Foil           | Foil Types           | ["None","Silver","Cold Foil"]                     |
  | abilities     | textarea    | Capacités            | Abilities            |                                                   |
  | flavor_text   | textarea    | Texte d'ambiance     | Flavor Text          |                                                   |

- [ ] **7.2** Créer le mapping Tako → CategoryField pour Lorcana dans `TAKO_CATEGORY_FIELD_MAPPING`

### Phase 8 — Tests & Validation

- [ ] **8.1** Tester le CRUD admin des champs catégorie (curl API)
- [ ] **8.2** Tester la création d'un item avec categoryMetadata
- [ ] **8.3** Tester l'import Tako Lorcana → vérifier que les champs spécifiques apparaissent dans la preview et sont sauvegardés
- [ ] **8.4** Tester la rétrocompatibilité (items existants, autres catégories sans champs custom)
- [ ] **8.5** Tester que les catégories non-default ne peuvent pas avoir de champs
- [ ] **8.6** Tester que seuls les admins peuvent gérer les champs catégorie

---

## 🔧 Fichiers impactés

### Backend — Nouveaux fichiers
| Fichier | Description |
|---------|-------------|
| `backend/src/database/entities/category-field.entity.ts` | Entité CategoryField |
| `backend/src/database/entities/item-category-metadata.entity.ts` | Entité ItemCategoryMetadata |
| `backend/src/modules/categories/dto/category-field.dto.ts` | DTOs CRUD champs |
| `backend/src/database/seeds/category-field-seed.service.ts` | Seed champs Lorcana |

### Backend — Fichiers modifiés
| Fichier | Modification |
|---------|-------------|
| `backend/src/database/entities/category.entity.ts` | Ajouter relation `fields: CategoryField[]` |
| `backend/src/database/entities/item.entity.ts` | Ajouter relation `categoryMetadata: ItemCategoryMetadata[]` |
| `backend/src/modules/items/items.service.ts` | `saveCategoryMetadata()`, modifier create/update/findOne/serializeItem |
| `backend/src/modules/items/dto/create-item.dto.ts` | Ajouter `categoryMetadata?` |
| `backend/src/modules/items/dto/update-item.dto.ts` | Ajouter `categoryMetadata?` |
| `backend/src/modules/categories/categories.controller.ts` | Endpoints admin CRUD champs + endpoint public |
| `backend/src/modules/categories/categories.service.ts` | Service CRUD champs catégorie |
| `backend/src/modules/tako/tako.service.ts` | `TAKO_CATEGORY_FIELD_MAPPING`, modifier getDomainMapping |
| `backend/src/app.module.ts` | Enregistrer nouvelles entités |

### Frontend — Fichiers modifiés
| Fichier | Modification |
|---------|-------------|
| `frontend/src/pages/items/ItemFormPage.tsx` | Chargement + rendu + sauvegarde categoryFields |
| `frontend/src/pages/items/ItemDetailPage.tsx` | Affichage categoryMetadata |
| `frontend/src/pages/categories/CategoryFormPage.tsx` | Section admin gestion champs |
| `frontend/src/services/category.service.ts` | Endpoints categoryFields |
| `frontend/src/types/category.types.ts` | Types CategoryField, ItemCategoryMetadata |
| `frontend/src/components/common/TakoImportPreview.tsx` | Section champs catégorie |

---

## 📊 Estimation effort

| Phase | Complexité | Description |
|-------|-----------|-------------|
| Phase 1 | ⭐⭐ | Entités + migration (auto via synchronize) |
| Phase 2 | ⭐⭐⭐ | CRUD admin backend (dupliquer pattern PrimaryType) |
| Phase 3 | ⭐⭐⭐⭐ | Sauvegarde/chargement metadata (cœur de la feature) |
| Phase 4 | ⭐⭐⭐⭐ | Frontend ItemFormPage (le plus complexe côté UI) |
| Phase 5 | ⭐⭐⭐ | Admin UI dans CategoryFormPage |
| Phase 6 | ⭐⭐⭐ | Import Tako mapping catégorie |
| Phase 7 | ⭐ | Seed Lorcana |
| Phase 8 | ⭐⭐ | Tests validation |

---

## 🔍 Points d'attention

1. **Items multi-catégories** : Un item peut appartenir à "Cartes à collectionner" ET "Lorcana".
   Les champs catégorie de "Lorcana" doivent apparaître, mais pas ceux d'une autre catégorie par défaut TCG.
   → Solution : le frontend charge les CategoryFields de toutes les catégories sélectionnées qui sont `is_default=true`

2. **Collision de field_key** : Si PrimaryType `trading_cards` a un champ `rarity` et la catégorie `Lorcana` aussi → le champ type prime.
   Le backend doit ignorer les champs catégorie dont le `field_key` existe déjà dans le PrimaryType.

3. **Performance** : Chargement additionnaire de la table `category_fields` + `item_category_metadata`.
   Prévoir un cache Redis comme pour `primary_type_fields`.

4. **Copie de catégorie** : Si un user copie une catégorie par défaut, il ne peut PAS modifier les champs
   (seul l'admin peut). Mais les champs restent visibles et utilisables pour les items.

5. **Suppression d'un champ** : `ON DELETE CASCADE` sur `item_category_metadata` → supprime automatiquement
   les valeurs associées dans tous les items.

---

## 📌 Log des changements

| Date | Phase | Description |
|------|-------|-------------|
| 13/03/2026 | - | Création du fichier workflow, conception architecture |
| | | |
