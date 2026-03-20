# 🗄️ SCHÉMA DE BASE DE DONNÉES - SnowShelf v2

> **Document de référence** - Structure complète de la base de données
> 
> **Date de création** : 20 février 2026
> **SGBD** : MariaDB 10.11+
> **Charset** : utf8mb4_unicode_ci

---

## 📐 Diagramme ERD (Simplifié)

```
┌────────────┐         ┌────────────┐         ┌────────────┐
│   users    │────────<│   items    │>───────│ categories │
└────────────┘         └────────────┘         └────────────┘
      │                    │   │   │                 │
      │                    │   │   │                 ├──>┌────────────┐
      ▼                    │   │   │                 │   │cat_images  │
┌────────────┐             │   │   │                 │   │cat_videos  │
│users_api   │             │   │   │                 │   │cat_audio   │
│_keys       │             │   │   │                 │   │cat_docs    │
└────────────┘             │   │   │                 │   └────────────┘
                           │   │   │                 │
      ┌────────────┐       │   │   │                 ├──>┌────────────┐
      │  statuses  │<──────┘   │   │                 │   │cat_grades  │
      └────────────┘           │   │                 │   └────────────┘
                               │   │                 │          │
      ┌────────────┐           │   │                 │          ▼
      │  storage_  │<──────────┘   │              ┌────────────┐
      │ locations  │               │              │   grades   │
      └────────────┘               │              └────────────┘
                                   │                    ▲
      ┌────────────┐               │                    │
      │item_images │<──────────────┤              ┌────────────┐
      │item_videos │               ├─────────────>│item_grades │
      │item_audio  │               │              └────────────┘
      │item_docs   │               │
      └────────────┘               │
                                   ▼
                             ┌────────────┐
                             │   item_    │
                             │ metadata   │
                             └────────────┘
                                   │
                                   ▼
                             ┌────────────┐     ┌──────────────┐
                             │  primary_  │────>│ pt_key_to_   │
                             │ type_fields│     │   _field     │
                             └────────────┘     └──────────────┘

Hiérarchie catégories (par utilisateur) :
┌────────────┐                ┌─────────────────────────────┐
│ categories │<──────────────>│   category_relationships    │ (per-user)
└────────────┘                │   user_id + parent + child  │
                              └─────────────────────────────┘
                              ┌─────────────────────────────┐
                              │ category_relationships_     │ (admin defaults)
                              │        default              │
                              └─────────────────────────────┘
```

---

## 👤 Table: users

Stocke les comptes utilisateurs.

```sql
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('free', 'premium', 'admin') NOT NULL DEFAULT 'free',
  
  -- Premium
  premium_until DATE NULL,
  
  -- Email verification
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_token VARCHAR(64) NULL,
  email_token_expires TIMESTAMP NULL,
  
  -- Password reset
  reset_token VARCHAR(64) NULL,
  reset_token_expires TIMESTAMP NULL,
  
  -- Remember me
  remember_token VARCHAR(255) NULL,
  remember_expires TIMESTAMP NULL,
  
  -- Profile
  avatar_url VARCHAR(512) NULL,
  background_url VARCHAR(512) NULL,
  bio TEXT NULL,
  
  -- Preferences
  theme VARCHAR(32) NOT NULL DEFAULT 'dark',
  lang VARCHAR(5) NOT NULL DEFAULT 'fr',
  newsletter BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Collections visibility
  collections_visibility ENUM('private', 'public', 'friends') NOT NULL DEFAULT 'private',
  show_email BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Statistics (denormalized for performance)
  items_count INT UNSIGNED NOT NULL DEFAULT 0,
  categories_count INT UNSIGNED NOT NULL DEFAULT 0,
  total_value DECIMAL(12,2) NULL,
  
  -- Activity
  last_login_at TIMESTAMP NULL,
  last_activity_at TIMESTAMP NULL,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_role (role),
  INDEX idx_email_token (email_token),
  INDEX idx_reset_token (reset_token),
  
  -- Constraints
  CONSTRAINT chk_email_format CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$'),
  CONSTRAINT chk_premium_implies_date CHECK (role != 'premium' OR premium_until IS NOT NULL),
  CONSTRAINT chk_items_count CHECK (items_count >= 0),
  CONSTRAINT chk_categories_count CHECK (categories_count >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Indexes Additionnels pour Performance

```sql
-- Recherche full-text sur username (si besoin)
ALTER TABLE users ADD FULLTEXT INDEX ft_username (username);

-- Index composite pour authentification
CREATE INDEX idx_auth ON users(email, password_hash, email_verified);
```

---

## 🔑 Table: users_api_keys

> **⚠️ NON IMPLÉMENTÉ** — Prévue pour une version future (intégrations tierces).

Clés API personnelles des utilisateurs (pour intégrations).

```sql
CREATE TABLE users_api_keys (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  key_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(64) NOT NULL UNIQUE,
  api_secret VARCHAR(64) NOT NULL,
  permissions JSON NOT NULL DEFAULT '[]',
  
  -- Rate limiting
  rate_limit_per_hour INT UNSIGNED NOT NULL DEFAULT 100,
  
  -- Activity
  last_used_at TIMESTAMP NULL,
  requests_count INT UNSIGNED NOT NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMP NULL,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_api_key (api_key),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 📂 Table: categories

Catégories de collection (système + utilisateurs). Chaque catégorie est obligatoirement liée à un **type d'objet** (`primary_type_id`) qui détermine les providers Tako disponibles pour la recherche web. Des **providers par défaut** peuvent être configurés par catégorie.

```sql
CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL, -- NULL = catégorie système
  original_creator_id INT UNSIGNED NULL,
  primary_type_id INT UNSIGNED NOT NULL, -- Type d'objet (détermine les providers Tako)
  
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  description TEXT NULL,
  notes TEXT NULL, -- Notes privées
  
  -- Visual
  icon VARCHAR(255) NOT NULL DEFAULT '📁',
  icon_type ENUM('emoji', 'url') NOT NULL DEFAULT 'emoji',
  color VARCHAR(7) NOT NULL DEFAULT '#3498db',
  
  -- Tako providers
  default_providers JSON NULL, -- Ex: ["googlebooks","openlibrary"] — providers pré-sélectionnés
  
  -- Flags
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Statistics (denormalized)
  items_count INT UNSIGNED NOT NULL DEFAULT 0,
  
  -- Soft delete
  deleted_at TIMESTAMP NULL,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (original_creator_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (primary_type_id) REFERENCES primary_types(id),
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_slug (slug),
  INDEX idx_is_default (is_default),
  INDEX idx_is_public (is_public),
  INDEX idx_deleted_at (deleted_at),
  
  -- Unique constraint
  UNIQUE KEY unique_user_name (user_id, name),
  UNIQUE KEY unique_user_slug (user_id, slug),
  
  -- Constraints
  CONSTRAINT chk_default_implies_public CHECK (is_default = FALSE OR is_public = TRUE),
  CONSTRAINT chk_default_no_user CHECK (is_default = FALSE OR user_id IS NULL),
  CONSTRAINT chk_color_format CHECK (color REGEXP '^#[0-9A-Fa-f]{6}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catégories par défaut (avec type d'objet et providers par défaut)
INSERT INTO categories (name, slug, description, icon, color, is_default, is_public, primary_type_id, default_providers) VALUES
('Livres', 'livres', 'Livres, mangas, BD, romans, guides...', '📚', '#e74c3c', TRUE, TRUE, 1, '["googlebooks","openlibrary"]'),
('Jeux vidéo', 'jeux-video', 'Jeux vidéo toutes plateformes', '🎮', '#3498db', TRUE, TRUE, 2, '["igdb","rawg"]'),
('Musique', 'musique', 'Vinyles, CD, cassettes, éditions collector', '🎵', '#9b59b6', TRUE, TRUE, 3, '["discogs","deezer"]'),
('Films', 'films', 'Films en DVD, Blu-ray, 4K, collectors', '🎬', '#f39c12', TRUE, TRUE, 4, '["tmdb"]'),
('Séries', 'series', 'Séries TV et animées, coffrets', '📺', '#16a085', TRUE, TRUE, 5, '["tmdb"]'),
('Figurines', 'figurines', 'Figurines, statues, Funko Pop, Nendoroid...', '🧸', '#e67e22', TRUE, TRUE, 6, NULL),
('Jouets construction', 'jouets-construction', 'LEGO, Playmobil, Mega Construx...', '🧱', '#c0392b', TRUE, TRUE, 7, '["lego","rebrickable","brickset"]'),
('Jeux de société', 'jeux-de-societe', 'Jeux de plateau, jeux de rôle, puzzles', '🎲', '#27ae60', TRUE, TRUE, 8, '["bgg"]'),
('Cartes à collectionner', 'cartes-a-collectionner', 'Pokémon, Magic, Yu-Gi-Oh!, Lorcana...', '🃏', '#2980b9', TRUE, TRUE, 9, '["pokemon"]'),
('Albums d''images', 'albums-d-images', 'Albums Panini, stickers, chromos', '🖼️', '#8e44ad', TRUE, TRUE, 10, NULL),
('Consoles & Systèmes', 'consoles-systemes', 'Consoles de jeux, ordinateurs, systèmes rétro', '🕹️', '#1abc9c', TRUE, TRUE, 2, '["consolevariations"]'),
('VHS & LaserDisc', 'vhs-laserdisc', 'Cassettes VHS, LaserDisc, Betamax', '📼', '#d35400', TRUE, TRUE, 4, '["tmdb"]'),
('Vinyles', 'vinyles', 'Disques vinyles 33T, 45T, 78T', '💿', '#7d3c98', TRUE, TRUE, 3, '["discogs"]'),
('CD Audio', 'cd-audio', 'Compact Disc audio, singles, compilations', '💽', '#2e86c1', TRUE, TRUE, 3, '["discogs","deezer"]'),
('Divers', 'divers', 'Objets ne rentrant dans aucune autre catégorie', '📦', '#95a5a6', TRUE, TRUE, 11, NULL);
```

> **Admin & catégories par défaut** : Les utilisateurs admin peuvent modifier les catégories par défaut (nom, description, icône, couleur) et en créer de nouvelles via un flag `is_default`. Lorsqu'une catégorie devient par défaut, elle est automatiquement rendue publique et son `user_id` passe à `NULL`. Inversement, retirer le flag `is_default` nécessite d'assigner un `user_id`.

---

## 🔗 Table: category_relationships

Relations mère-fille entre catégories **par utilisateur**. Chaque utilisateur possède sa propre hiérarchie de catégories (comme dans la v1). Lorsqu'un utilisateur accède pour la première fois aux catégories par défaut, la hiérarchie par défaut (table `category_relationships_default`) est copiée dans cette table avec son `user_id`.

```sql
CREATE TABLE category_relationships (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id INT UNSIGNED NOT NULL,
  child_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_parent (parent_id),
  INDEX idx_child (child_id),
  INDEX idx_user (user_id),
  INDEX idx_user_parent (user_id, parent_id),
  
  -- Unique constraint (une seule relation parent-enfant par utilisateur)
  UNIQUE KEY unique_relationship (parent_id, child_id, user_id),
  
  -- Constraints
  CONSTRAINT chk_no_self_reference CHECK (parent_id != child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔗 Table: category_relationships_default

Hiérarchie par défaut des catégories, gérée par les administrateurs. Sert de modèle copié dans `category_relationships` pour chaque nouvel utilisateur.

```sql
CREATE TABLE category_relationships_default (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id INT UNSIGNED NOT NULL,
  child_id INT UNSIGNED NOT NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_parent (parent_id),
  INDEX idx_child (child_id),
  
  -- Unique constraint
  UNIQUE KEY unique_default_relationship (parent_id, child_id),
  
  -- Constraints
  CONSTRAINT chk_no_self_reference CHECK (parent_id != child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Fonctionnement hiérarchie** :
> - **Admin** gère la hiérarchie par défaut dans `category_relationships_default`
> - Lorsqu'un utilisateur est créé (ou accède pour la première fois), les relations par défaut sont copiées dans `category_relationships` avec son `user_id`
> - Chaque utilisateur peut ensuite personnaliser sa propre hiérarchie sans affecter les autres
> - Les catégories personnalisées créées par l'utilisateur n'ont pas de hiérarchie par défaut

---

## 🎮 Table: primary_types

Types primaires d'items (11 types fixes).

```sql
CREATE TABLE primary_types (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(50) NOT NULL UNIQUE,
  name_fr VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#3498db',
  sort_order INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_key_name (key_name),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données initiales (11 types)
INSERT INTO primary_types (key_name, name_fr, name_en, icon, color, sort_order) VALUES
('books', 'Livres', 'Books', '📚', '#e74c3c', 1),
('video_games', 'Jeux vidéo', 'Video Games', '🎮', '#3498db', 2),
('music', 'Musique', 'Music', '🎵', '#9b59b6', 3),
('movies', 'Films', 'Movies', '🎬', '#f39c12', 4),
('series', 'Séries', 'TV Series', '📺', '#16a085', 5),
('toys_fig', 'Figurines', 'Figurines', '🧸', '#e67e22', 6),
('toys_construct', 'Jouets construction', 'Construction Toys', '🧱', '#c0392b', 7),
('board_games', 'Jeux de société', 'Board Games', '🎲', '#27ae60', 8),
('trading_cards', 'Cartes à collectionner', 'Trading Cards', '🃏', '#2980b9', 9),
('sticker_albums', 'Albums d\'images', 'Sticker Albums', '🖼️', '#8e44ad', 10),
('divers', 'Divers', 'Miscellaneous', '📦', '#95a5a6', 11);
```

---

## 🏷️ Table: primary_type_fields

Champs de métadonnées par type primaire (pattern EAV).

```sql
CREATE TABLE primary_type_fields (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  primary_type_id INT UNSIGNED NOT NULL,
  
  field_key VARCHAR(50) NOT NULL,
  field_name_fr VARCHAR(100) NOT NULL,
  field_name_en VARCHAR(100) NOT NULL,
  
  field_type ENUM(
    'text',
    'textarea', 
    'number',
    'year',
    'date',
    'select',
    'multiselect',
    'url',
    'rating',
    'duration',
    'boolean'
  ) NOT NULL DEFAULT 'text',
  
  field_options JSON NULL, -- Pour select/multiselect
  
  placeholder_fr VARCHAR(200) NULL,
  placeholder_en VARCHAR(200) NULL,
  
  help_text_fr TEXT NULL,
  help_text_en TEXT NULL,
  
  icon VARCHAR(10) NULL,
  
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_searchable BOOLEAN NOT NULL DEFAULT TRUE,
  is_filterable BOOLEAN NOT NULL DEFAULT TRUE,
  
  sort_order INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (primary_type_id) REFERENCES primary_types(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_type_id (primary_type_id),
  INDEX idx_field_key (field_key),
  INDEX idx_sort_order (sort_order),
  
  -- Unique constraint
  UNIQUE KEY unique_type_field (primary_type_id, field_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 📦 Table: items

Items de collection (objets).

```sql
CREATE TABLE items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  primary_type_id INT UNSIGNED NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL,
  description TEXT NULL,
  notes TEXT NULL, -- Notes privées
  
  -- Pricing
  purchase_price DECIMAL(10,2) NULL,
  market_value DECIMAL(10,2) NULL,
  
  -- Rating
  rating TINYINT UNSIGNED NULL,
  
  -- Dates
  date_obtained DATE NULL,
  
  -- Status
  status_id INT UNSIGNED NULL,
  
  -- Barcode
  barcode VARCHAR(50) NULL,
  
  -- Storage
  storage_location_id INT UNSIGNED NULL,
  
  -- Soft delete
  deleted_at TIMESTAMP NULL,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (primary_type_id) REFERENCES primary_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL,
  FOREIGN KEY (storage_location_id) REFERENCES storage_locations(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_type_id (primary_type_id),
  INDEX idx_name (name),
  INDEX idx_barcode (barcode),
  INDEX idx_rating (rating),
  INDEX idx_market_value (market_value),
  INDEX idx_date_obtained (date_obtained),
  INDEX idx_status_id (status_id),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_created_at (created_at DESC),
  
  -- Full-text search
  FULLTEXT INDEX ft_search (name, description),
  
  -- Composite indexes for common queries
  INDEX idx_user_type (user_id, primary_type_id),
  INDEX idx_user_created (user_id, created_at DESC),
  
  -- Unique constraint
  UNIQUE KEY unique_user_slug (user_id, slug),
  
  -- Constraints
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT chk_purchase_price CHECK (purchase_price >= 0),
  CONSTRAINT chk_market_value CHECK (market_value >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔗 Table: item_categories

Relation many-to-many items ↔ categories.

```sql
CREATE TABLE item_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_item_id (item_id),
  INDEX idx_category_id (category_id),
  
  -- Unique constraint
  UNIQUE KEY unique_item_category (item_id, category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 📝 Table: item_metadata

Valeurs des métadonnées dynamiques (pattern EAV).

```sql
CREATE TABLE item_metadata (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  field_id INT UNSIGNED NOT NULL,
  
  -- Valeurs typées (une seule sera non-NULL)
  value_text TEXT NULL,
  value_number DECIMAL(15,2) NULL,
  value_date DATE NULL,
  value_json JSON NULL, -- Pour multiselect, arrays
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES primary_type_fields(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_item_id (item_id),
  INDEX idx_field_id (field_id),
  INDEX idx_value_text (value_text(100)),
  INDEX idx_value_number (value_number),
  INDEX idx_value_date (value_date),
  
  -- Composite index for lookups
  INDEX idx_item_field (item_id, field_id),
  
  -- Unique constraint (un champ par item)
  UNIQUE KEY unique_item_field (item_id, field_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🏷️ Table: statuses

Statuts de possession/état des items (système + personnalisés).

```sql
CREATE TABLE statuses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL, -- NULL = statut par défaut (système)
  
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6b7280',
  icon VARCHAR(50) NOT NULL DEFAULT 'tag',
  ordre INT NOT NULL DEFAULT 0,
  
  defaut TINYINT(1) NOT NULL DEFAULT 0, -- 1 = statut système partagé
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_defaut (defaut),
  INDEX idx_ordre (ordre),
  
  CONSTRAINT chk_color_format CHECK (color REGEXP '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT chk_default_no_user CHECK (defaut = 0 OR user_id IS NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Statuts par défaut
INSERT INTO statuses (name, description, color, icon, ordre, defaut) VALUES
('Possédé', 'Item en votre possession', '#22c55e', 'check-circle', 1, 1),
('Recherché', 'Item que vous recherchez', '#f59e0b', 'search', 2, 1),
('En transit', 'Item en cours de livraison', '#3b82f6', 'truck', 3, 1),
('Prêté', 'Item prêté à quelqu''un', '#a855f7', 'share-2', 4, 1),
('Vendu', 'Item vendu', '#ef4444', 'tag', 5, 1),
('Wishlist', 'Item souhaité', '#ec4899', 'heart', 6, 1);
```

---

## ⭐ Table: grades

États physiques / conditions des items (système + personnalisés par user Premium/Admin).

```sql
CREATE TABLE grades (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL, -- NULL = grade par défaut (système)
  
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  
  defaut TINYINT(1) NOT NULL DEFAULT 0, -- 1 = grade système partagé
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_defaut (defaut),
  
  CONSTRAINT chk_default_no_user CHECK (defaut = 0 OR user_id IS NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Grades par défaut
INSERT INTO grades (name, description, defaut) VALUES
('Comme neuf', 'État impeccable, sans trace d''usure', 1),
('Très bon état', 'Légères traces d''usure', 1),
('Bon état', 'Traces d''usure normales', 1),
('État correct', 'Usure visible mais fonctionnel', 1),
('Mauvais état', 'Usure importante', 1),
('Pour pièces', 'Non fonctionnel, pour récupération', 1),
('Boîte manquante', 'Item sans sa boîte d''origine', 1),
('Notice manquante', 'Item sans sa notice', 1),
('Complet', 'Tous les éléments sont présents', 1),
('Incomplet', 'Il manque des éléments', 1),
('Scellé', 'Encore dans son emballage d''origine', 1);
```

---

## 🔗 Table: category_grades

Association catégories ↔ grades (détermine quels grades sont proposés pour les items d'une catégorie).

```sql
CREATE TABLE category_grades (
  category_id INT UNSIGNED NOT NULL,
  grade_id INT UNSIGNED NOT NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (category_id, grade_id),
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  
  INDEX idx_category_id (category_id),
  INDEX idx_grade_id (grade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Fonctionnement** : Quand l'utilisateur sélectionne des catégories dans le formulaire d'item, les grades proposés dans le multi-select sont l'union des grades associés à ces catégories (via `category_grades`). Un item peut avoir multiple grades (via `item_grades`).

---

## 🖼️ Tables Médias Items

### item_images

```sql
CREATE TABLE item_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  
  url VARCHAR(512) NOT NULL,
  thumbnail_url VARCHAR(512) NOT NULL,
  title VARCHAR(255) NULL,
  
  -- Metadata
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size INT UNSIGNED NOT NULL,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  
  -- Order
  display_order INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_item_id (item_id),
  INDEX idx_display_order (item_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### item_videos

```sql
CREATE TABLE item_videos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  
  url VARCHAR(512) NOT NULL,
  thumbnail_url VARCHAR(512) NULL,
  title VARCHAR(255) NULL,
  
  -- Metadata
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size INT UNSIGNED NOT NULL,
  duration INT UNSIGNED NULL, -- en secondes
  
  -- Order
  display_order INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  INDEX idx_item_id (item_id),
  INDEX idx_display_order (item_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### item_audio

```sql
CREATE TABLE item_audio (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  
  url VARCHAR(512) NOT NULL,
  title VARCHAR(255) NULL,
  
  -- Metadata
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size INT UNSIGNED NOT NULL,
  duration INT UNSIGNED NULL, -- en secondes
  
  -- Order
  display_order INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  INDEX idx_item_id (item_id),
  INDEX idx_display_order (item_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### item_documents

```sql
CREATE TABLE item_documents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT UNSIGNED NOT NULL,
  
  url VARCHAR(512) NOT NULL,
  title VARCHAR(255) NULL,
  
  -- Metadata
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size INT UNSIGNED NOT NULL,
  
  -- Order
  display_order INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  INDEX idx_item_id (item_id),
  INDEX idx_display_order (item_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## �️ Tables Médias Catégories

Structure identique aux tables médias items, référençant `category_id` au lieu de `item_id`.

### category_images

```sql
CREATE TABLE category_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  
  url VARCHAR(512) NOT NULL,
  thumbnail_url VARCHAR(512) NOT NULL,
  title VARCHAR(255) NULL,
  
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size INT UNSIGNED NOT NULL,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  
  display_order INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category_id (category_id),
  INDEX idx_display_order (category_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### category_videos

```sql
CREATE TABLE category_videos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  
  url VARCHAR(512) NOT NULL,
  thumbnail_url VARCHAR(512) NULL,
  title VARCHAR(255) NULL,
  
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size INT UNSIGNED NOT NULL,
  duration INT UNSIGNED NULL,
  
  display_order INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category_id (category_id),
  INDEX idx_display_order (category_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### category_audio

```sql
CREATE TABLE category_audio (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  
  url VARCHAR(512) NOT NULL,
  title VARCHAR(255) NULL,
  
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size INT UNSIGNED NOT NULL,
  duration INT UNSIGNED NULL,
  
  display_order INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category_id (category_id),
  INDEX idx_display_order (category_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### category_documents

```sql
CREATE TABLE category_documents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  
  url VARCHAR(512) NOT NULL,
  title VARCHAR(255) NULL,
  
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size INT UNSIGNED NOT NULL,
  
  display_order INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category_id (category_id),
  INDEX idx_display_order (category_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Stockage** : Les fichiers médias des catégories par défaut sont dans `/storage/default_categories/{catId}/{mediaType}/`, ceux des catégories utilisateurs dans `/storage/users/{userId}/Categories/{catId}/{mediaType}/`. Lors du changement du flag `is_default`, les fichiers sont automatiquement transférés entre les deux emplacements.

---

## �📍 Table: storage_locations

Emplacements physiques de stockage.

```sql
CREATE TABLE storage_locations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  location VARCHAR(255) NULL,
  
  -- Statistics
  items_count INT UNSIGNED NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔗 Table: item_grades

Relation many-to-many items ↔ grades (un item peut avoir plusieurs grades).

```sql
CREATE TABLE item_grades (
  item_id INT UNSIGNED NOT NULL,
  grade_id INT UNSIGNED NOT NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (item_id, grade_id),
  
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE SET NULL,
  
  INDEX idx_item_id (item_id),
  INDEX idx_grade_id (grade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Fonctionnement dynamique** : Les grades proposés dans le formulaire d'item dépendent des catégories sélectionnées. Le frontend charge les grades en faisant une union des grades liés aux catégories via `category_grades`. Ex: si l'item est dans la catégorie "Jeux vidéo" qui a les grades "Complet", "Boîte manquante", "Notice manquante" associés, seuls ces grades seront proposés.

---

## ⚙️ Tables Configuration

### upload_config

```sql
CREATE TABLE upload_config (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(50) NOT NULL UNIQUE,
  
  allowed_extensions JSON NOT NULL,
  max_size_mb INT UNSIGNED NOT NULL DEFAULT 10,
  
  description VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO upload_config (category, allowed_extensions, max_size_mb, description) VALUES
('avatar', '["jpg","jpeg","png","gif","webp"]', 5, 'Avatars utilisateurs'),
('images', '["jpg","jpeg","png","gif","webp","svg"]', 10, 'Images d''items et catégories'),
('videos', '["mp4","webm","avi","mkv","mov"]', 500, 'Vidéos d''items et catégories'),
('audio', '["mp3","wav","ogg","flac"]', 50, 'Fichiers audio d''items et catégories'),
('documents', '["pdf","doc","docx","txt","zip","epub","cbr","cbz"]', 500, 'Documents d''items et catégories');
```

### tako_api_config

```sql
CREATE TABLE tako_api_config (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  
  api_url VARCHAR(512) NOT NULL DEFAULT 'http://localhost:3000',
  
  timeout_ms INT UNSIGNED NOT NULL DEFAULT 30000,
  max_results_default INT UNSIGNED NOT NULL DEFAULT 20,
  
  cache_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  cache_ttl_seconds INT UNSIGNED NOT NULL DEFAULT 3600,
  
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  notes TEXT NULL COMMENT 'Notes de configuration',
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuration par défaut
INSERT INTO tako_api_config (api_url, notes) VALUES
('http://localhost:3000', 'Configuration Tako_Api locale pour développement');
```

**Description** : Configuration centralisée pour Tako_Api. Un seul endpoint unifié remplace les 22 providers individuels de la version précédente. Tako_Api gère 32 providers répartis en 11 domaines (construction-toys, books, comics, anime-manga, media, videogames, boardgames, collectibles, tcg, music, ecommerce). Les clés API des providers externes sont gérées exclusivement dans le fichier `.env` de Tako_Api — SnowShelf n'a pas besoin de les connaître et aucune authentification n'est requise pour accéder à Tako_Api.

### primary_type_key_to_field

> **⚠️ NON IMPLÉMENTÉ** — Prévu pour l'auto-mapping des réponses Tako_Api. Le mapping est actuellement fait côté frontend.

Mapping des clés de réponse Tako_Api vers les champs de métadonnées SnowShelf.

```sql
CREATE TABLE primary_type_key_to_field (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  field_id INT UNSIGNED NOT NULL,
  
  api_keys JSON NOT NULL COMMENT 'Clés API à mapper (ex: ["author", "authors", "writer"])',
  transform_type ENUM('direct', 'array_join', 'first_element', 'date_parse', 'number_parse', 'custom') NOT NULL DEFAULT 'direct',
  transform_config JSON NULL COMMENT 'Config de transformation (separateur, format, etc.)',
  
  priority INT NOT NULL DEFAULT 0 COMMENT 'Priorité si plusieurs mappings pour un même champ',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (field_id) REFERENCES primary_type_fields(id) ON DELETE CASCADE,
  INDEX idx_field_id (field_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Utilisation** : Lors d'un import depuis Tako_Api, le système parcourt les clés de la réponse API et utilise ce mapping pour remplir automatiquement les champs de métadonnées de l'item. Le `transform_type` permet d'adapter le format (ex: joindre un tableau d'auteurs en texte, parser une date, etc.).

### tako_api_domain_mapping

```sql
CREATE TABLE tako_api_domain_mapping (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  
  primary_type_id INT UNSIGNED NOT NULL,
  tako_domain VARCHAR(50) NOT NULL COMMENT 'Construction-toys, videogames, books, etc.',
  
  preferred_providers JSON NULL COMMENT 'Liste providers préférés pour ce type',
  
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (primary_type_id) REFERENCES primary_type(id) ON DELETE CASCADE,
  INDEX idx_primary_type (primary_type_id),
  INDEX idx_tako_domain (tako_domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mappings par défaut
INSERT INTO tako_api_domain_mapping (primary_type_id, tako_domain, preferred_providers) VALUES
(1, 'videogames', '["igdb", "rawg"]'),
(2, 'books', '["google-books", "openlibrary"]'),
(3, 'music', '["discogs", "deezer"]'),
(4, 'media', '["tmdb"]'),
(5, 'media', '["tmdb"]'),
(6, 'construction-toys', '["lego", "rebrickable"]'),
(7, 'collectibles', '["coleka"]'),
(8, 'comics', '["comicvine", "bedetheque"]'),
(9, 'anime-manga', '["jikan"]'),
(10, 'boardgames', '["boardgamegeek"]'),
(11, 'tcg', '["pokemon-tcg"]');
```

**Description** : Mapping entre les types primaires de SnowShelf et les domaines Tako_Api. Permet de router automatiquement les recherches vers le bon domaine avec les providers appropriés.

---

## 📊 Tables Analytics (Optionnel)

> **⚠️ NON IMPLÉMENTÉ** — Les analytics admin utilisent actuellement des requêtes directes sur les tables existantes.

### user_activity_log

```sql
CREATE TABLE user_activity_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id INT UNSIGNED NULL,
  
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  
  metadata JSON NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  INDEX idx_user_action (user_id, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## � Tables Notifications

### Table: `notifications`

Notifications in-app pour les utilisateurs.

```sql
CREATE TABLE notifications (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    type            VARCHAR(50) NOT NULL DEFAULT 'system',
    title           VARCHAR(255) NOT NULL,
    message         TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    metadata        JSON DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, is_read),
    INDEX idx_notif_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: `push_subscriptions`

Souscriptions Web Push (VAPID) — une ligne par device/navigateur.

```sql
CREATE TABLE push_subscriptions (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    endpoint        TEXT NOT NULL,
    endpoint_hash   VARCHAR(64) NOT NULL UNIQUE,  -- SHA256 de l'endpoint
    p256dh          TEXT NOT NULL,
    auth            TEXT NOT NULL,
    user_agent      VARCHAR(500) DEFAULT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    last_push_at    TIMESTAMP NULL DEFAULT NULL,
    failure_count   INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_push_user_active (user_id, is_active),
    INDEX idx_push_endpoint_hash (endpoint_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Logique de nettoyage** : les souscriptions avec `failure_count >= 5` sont désactivées automatiquement.
> Les souscriptions inactives sont purgées périodiquement par `PushService.cleanupExpired()`.

---

## �🔧 Triggers & Procedures

### Trigger: Mettre à jour items_count dans users

```sql
DELIMITER $$

CREATE TRIGGER trg_items_after_insert
AFTER INSERT ON items
FOR EACH ROW
BEGIN
  UPDATE users 
  SET items_count = items_count + 1 
  WHERE id = NEW.user_id;
END$$

CREATE TRIGGER trg_items_after_delete
AFTER DELETE ON items
FOR EACH ROW
BEGIN
  UPDATE users 
  SET items_count = items_count - 1 
  WHERE id = OLD.user_id;
END$$

DELIMITER ;
```

### Trigger: Mettre à jour items_count dans categories

```sql
DELIMITER $$

CREATE TRIGGER trg_item_categories_after_insert
AFTER INSERT ON item_categories
FOR EACH ROW
BEGIN
  UPDATE categories 
  SET items_count = items_count + 1 
  WHERE id = NEW.category_id;
END$$

CREATE TRIGGER trg_item_categories_after_delete
AFTER DELETE ON item_categories
FOR EACH ROW
BEGIN
  UPDATE categories 
  SET items_count = items_count - 1 
  WHERE id = OLD.category_id;
END$$

DELIMITER ;
```

---

## 🚀 Optimisations

### Partitionnement (pour grandes instances)

```sql
-- Partitionner items par date de création (par année)
ALTER TABLE items
PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION p2027 VALUES LESS THAN (2028),
  PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

### Tables en mémoire pour performances critiques

> **⚠️ NON IMPLÉMENTÉ** — Les sessions utilisent Redis (cache-manager-redis-store), pas de table MariaDB.

```sql
-- Cache des sessions (Redis préférable en prod)
CREATE TABLE sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  data JSON NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=MEMORY;
```

---

## 📋 Scripts de Maintenance

### Nettoyage des tokens expirés

```sql
-- À exécuter quotidiennement
DELETE FROM users 
WHERE email_token_expires < NOW() 
  AND email_verified = FALSE 
  AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

DELETE FROM users 
WHERE reset_token_expires < NOW();
```

### Recalcul des statistiques

```sql
-- Recalculer items_count pour tous les utilisateurs
UPDATE users u
SET items_count = (
  SELECT COUNT(*) FROM items i 
  WHERE i.user_id = u.id AND i.deleted_at IS NULL
);

-- Recalculer items_count pour toutes les catégories
UPDATE categories c
SET items_count = (
  SELECT COUNT(*) FROM item_categories ic 
  WHERE ic.category_id = c.id
);
```

---

**Ce schéma est optimisé pour performance et extensibilité. Il prend en compte les requêtes fréquentes et la scalabilité future.**

---

## 👫 Table: friendships

Relations d’amitié entre utilisateurs.

```sql
CREATE TABLE friendships (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  requester_id INT UNSIGNED NOT NULL,
  addressee_id INT UNSIGNED NOT NULL,
  status ENUM('pending', 'accepted', 'declined', 'blocked') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_friendship (requester_id, addressee_id),
  INDEX idx_addressee_status (addressee_id, status),
  INDEX idx_requester_status (requester_id, status)
);
```

### Colonnes ajoutées à `users`

```sql
-- Politique de demandes d'amis
ALTER TABLE users ADD COLUMN friend_request_policy ENUM('everyone', 'nobody') NOT NULL DEFAULT 'everyone';
```

### Logique métier

- **requester** : celui qui envoie la demande
- **addressee** : celui qui reçoit la demande (seul lui peut accept/decline)
- **Convention blocage** : addressee = bloqueur
- **Anti-énumération email** : l’endpoint `request-by-email` retourne le même message pour «lemail inconnu» et «refuse les demandes»
- **Auto-accept** : si A envoie à B et B avait déjà envoyé à A (pending), la relation passe directement à accepted
