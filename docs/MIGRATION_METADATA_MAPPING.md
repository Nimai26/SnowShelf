# Migration : Système de Mapping Métadonnées Dynamique

> **Statut** : 🔄 En cours - Phase 3 terminée
> **Date de début** : 2025-12-18
> **Objectif** : Remplacer le système hard-codé de mapping API → champs par un système dynamique géré en BDD

---

## 📋 Résumé du problème

Le système actuel de mapping entre les réponses API et les champs de métadonnées est :
- **Hard-codé** dans plusieurs fichiers JS (`TYPE_SPECIFIC_FIELDS` dans web-search.js)
- **Non-maintenable** avec des exceptions partout (`normalizeFieldValue` dans collection.js)
- **Non-évolutif** : ajouter un nouveau type ou provider nécessite de modifier le code
- **Redondant** : les mêmes mappings sont dupliqués entre PHP et JS

---

## 🎯 Objectifs de la migration

1. **Centraliser** tous les mappings dans la BDD
2. **Administrer** les mappings via l'interface admin
3. **Simplifier** la structure i18n des champs
4. **Automatiser** les transformations de valeurs (status, dates, etc.)
5. **Supprimer** tout le code hard-codé

---

## 🗄️ Modifications de schéma BDD

### 1. Nouvelle table `primary_type_key_to_field`

```sql
CREATE TABLE primary_type_key_to_field (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_id INT NOT NULL,                    -- FK vers primary_type_fields.id
    api_keys JSON NOT NULL,                   -- ["metadata.stars", "metadata.actors"]
    transform_type VARCHAR(50) DEFAULT NULL,  -- 'status_mapping', 'year_extract', etc.
    transform_config JSON DEFAULT NULL,       -- Config du transform
    priority INT DEFAULT 0,                   -- Ordre de priorité
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (field_id) REFERENCES primary_type_fields(id) ON DELETE CASCADE
);
```

### 2. Modification table `primary_type_fields`

**Colonnes à supprimer :**
- `field_name_fr`
- `field_name_en`
- `placeholder_fr`
- `placeholder_en`
- `help_text_fr`
- `help_text_en`

**Colonne à ajouter :**
- `lang` JSON : `{"fr": {"name": "...", "placeholder": "...", "help": "..."}, "en": {...}}`

---

## 📁 Fichiers impactés

### Fichiers à modifier

| Fichier | Modifications |
|---------|---------------|
| `public/api/web-search.php` | Charger mappings depuis BDD, supprimer normalisation hard-codée |
| `public/assets/js/web-search.js` | Supprimer `TYPE_SPECIFIC_FIELDS`, charger dynamiquement |
| `public/assets/js/collection.js` | Supprimer `normalizeFieldValue` hard-codé, utiliser transforms BDD |
| `public/api/item-metadata.php` | Adapter pour nouveau format i18n |
| `public/admin/views/settings.php` | Ajouter onglets "Champs de détails" et "Mappings API" |

### Nouveaux fichiers à créer

| Fichier | Description |
|---------|-------------|
| `public/api/admin/field-mappings.php` | API CRUD pour `primary_type_key_to_field` |
| `public/api/admin/type-fields.php` | API CRUD pour `primary_type_fields` |
| `public/admin/views/field-mappings.php` | Interface admin mappings |
| `public/admin/views/type-fields.php` | Interface admin champs |
| `public/assets/js/admin/field-mappings.js` | JS pour interface mappings |
| `public/assets/js/admin/type-fields.js` | JS pour interface champs |
| `core/FieldTransformer.php` | Classe de transformation des valeurs |

---

## 🔄 Étapes de migration

### Phase 1 : Préparation BDD
- [x] Étape 1.1 : Créer table `primary_type_key_to_field`
- [x] Étape 1.2 : Créer table `field_transform_types`
- [x] Étape 1.3 : Ajouter colonne `lang` à `primary_type_fields`
- [x] Étape 1.4 : Migrer données i18n existantes vers JSON
- [x] Étape 1.5 : Supprimer anciennes colonnes i18n
- [x] Étape 1.6 : Peupler `primary_type_key_to_field` avec mappings existants

### Phase 2 : Backend PHP
- [x] Étape 2.1 : Créer classe `FieldTransformer.php`
- [x] Étape 2.2 : Créer API `admin/field-mappings.php`
- [x] Étape 2.3 : Créer API `admin/type-fields.php`
- [ ] Étape 2.4 : Modifier `item-metadata.php` pour nouveau format i18n

### Phase 3 : Interface Admin
- [x] Étape 3.1 : Ajouter onglets dans `admin/index.php` (Champs de détails, Mappings API)
- [x] Étape 3.2 : Ajouter panels HTML avec tables et filtres
- [x] Étape 3.3 : Ajouter fonctions JS dans `admin-settings.js` (loadTypeFields, loadFieldMappings)
- [x] Étape 3.4 : Ajouter styles CSS pour les nouvelles interfaces
- [x] Étape 3.5 : Modals de création/édition avec validations

### Phase 4 : Migration Web Search
- [ ] Étape 4.1 : Modifier `web-search.php` pour utiliser mappings BDD
- [ ] Étape 4.2 : Créer endpoint API pour récupérer mappings côté JS
- [ ] Étape 4.3 : Modifier `web-search.js` pour charger mappings dynamiquement
- [ ] Étape 4.4 : Supprimer `TYPE_SPECIFIC_FIELDS` et code legacy

### Phase 5 : Migration Collection
- [ ] Étape 5.1 : Modifier `collection.js` pour utiliser transforms BDD
- [ ] Étape 5.2 : Supprimer `normalizeFieldValue` hard-codé

### Phase 6 : Peuplement et nettoyage
- [ ] Étape 6.1 : Peupler `primary_type_key_to_field` avec mappings existants
- [ ] Étape 6.2 : Tester tous les types primaires
- [ ] Étape 6.3 : Supprimer code legacy
- [ ] Étape 6.4 : Documentation finale

---

## 🔧 Types de transformations supportées

| Type | Description | Config exemple |
|------|-------------|----------------|
| `none` | Aucune transformation | `null` |
| `status_mapping` | Mapping statut EN→FR | `{"ended":"Terminée","canceled":"Annulée"}` |
| `year_extract` | Extraire année d'une date | `null` |
| `array_join` | Joindre tableau avec séparateur | `{"separator": ", "}` |
| `boolean_fr` | Convertir bool en Oui/Non | `null` |
| `pegi_normalize` | Normaliser classification âge | `null` |
| `duration_format` | Formater durée en minutes | `{"unit": "minutes"}` |
| `first_value` | Prendre première valeur d'un tableau | `null` |

---

## 📊 Données de migration

### Mappings à créer pour type `series` (ID=5)

| Champ | API Keys | Transform |
|-------|----------|-----------|
| creator | `["metadata.director", "metadata.created_by", "metadata.directors"]` | `array_join` |
| actors | `["metadata.stars", "metadata.actors", "metadata.cast"]` | `array_join` |
| year_start | `["metadata.year", "metadata.first_air_date"]` | `year_extract` |
| year_end | `["metadata.end_year"]` | `year_extract` |
| genre | `["metadata.genres", "metadata.genre"]` | `array_join` |
| season | `["metadata.total_seasons", "metadata.seasons"]` | `first_value` |
| episodes | `["metadata.total_episodes", "metadata.episodes"]` | `first_value` |
| network | `["metadata.networks", "metadata.network"]` | `first_value` |
| status | `["metadata.status"]` | `status_mapping` |

### Mappings à créer pour type `movies` (ID=4)

| Champ | API Keys | Transform |
|-------|----------|-----------|
| director | `["metadata.director", "metadata.directors"]` | `array_join` |
| actors | `["metadata.stars", "metadata.actors", "metadata.cast"]` | `array_join` |
| year | `["metadata.year", "metadata.release_date"]` | `year_extract` |
| genre | `["metadata.genres", "metadata.genre"]` | `array_join` |
| duration | `["metadata.runtime", "metadata.duration"]` | `duration_format` |
| language | `["metadata.original_language"]` | `none` |
| studio | `["metadata.production_companies"]` | `first_value` |

*(Autres types à documenter lors de l'étape 6.1)*

---

## ⚠️ Points d'attention

1. **Backup BDD** avant toute modification de schéma
2. **Tester** chaque étape sur un type primaire avant de généraliser
3. **Conserver** temporairement l'ancien code commenté jusqu'à validation complète
4. **Logger** les transformations pour debug

---

## 📝 Notes de progression

### 2025-12-23
- Refactoring complet du JS admin en modules ES6
- Audit et correction des violations de thème CSS
- Protection double-init pour dropdowns dans modals
- Chargement référence data garanti avant ouverture modals
- Nettoyage imports inutilisés

### 2025-12-18
- Création du plan de migration
- Début Phase 1 : Création table `primary_type_key_to_field`

