# 🔄 MIGRATION DES DONNÉES - SnowShelf v1 → v2

> **Guide de migration complet** - Transition sécurisée des données
> 
> **Date de création** : 20 février 2026
> **Status** : 📋 Stratégie complète

---

## 🎯 Objectifs de la Migration

### Priorités
✅ **Zero Data Loss** : Aucune perte de données  
✅ **Minimal Downtime** : Maintenance <2h  
✅ **Rollback Ready** : Plan de retour arrière testé  
✅ **Validation Complète** : Tests exhaustifs  

### Contraintes
- Migration en production un week-end
- Backup complet avant migration
- Tests préalables sur données anonymisées
- Plan de rollback mature

---

## 📊 Analyse des Données Existantes

### Tables v1 → v2

| Table v1 | Table v2 | Transformation | Complexité |
|----------|----------|----------------|------------|
| `users` | `users` | Ajout champs + hash passwords | 🟡 Moyenne |
| `categories` | `categories` | Ajout slug, is_default, is_public, notes | 🟡 Moyenne |
| `category_mothers` | `category_relationships` | Ajout user_id (per-user hierarchy) | 🟡 Moyenne |
| `category_mothers_default` | `category_relationships_default` | Quasi identique | 🟢 Facile |
| `category_grades` | `category_grades` | Identique | 🟢 Facile |
| `items` | `items` | Restructuration champs | 🟡 Moyenne |
| `item_metadata` | `item_metadata` | EAV structure similaire | 🟢 Facile |
| `primary_types` | `primary_types` | Identique | 🟢 Facile |
| `primary_type_fields` | `primary_type_fields` | Identique | 🟢 Facile |
| `item_images` | `item_images` | Nouveau storage_path | 🟡 Moyenne |
| `item_videos` | `item_videos` | Nouveau storage_path | 🟡 Moyenne |
| `item_audio` | `item_audio` | Nouveau storage_path | 🟡 Moyenne |
| `item_documents` | `item_documents` | Nouveau storage_path | 🟡 Moyenne |
| `category_img` | `category_images` | Nouveau storage_path + champs | 🟡 Moyenne |
| `category_videos` | `category_videos` | Nouveau storage_path + champs | 🟡 Moyenne |
| `category_audio` | `category_audio` | Nouveau storage_path + champs | 🟡 Moyenne |
| `category_doc` | `category_documents` | Nouveau storage_path + champs | 🟡 Moyenne |
| `storage_locations` | `storage_locations` | Identique | 🟢 Facile |
| `web_api_providers` | `tako_api_config` | Architecture unifiée | 🟡 Moyenne |
| `upload_config` | `upload_config` | Identique | 🟢 Facile |

### Volumes de Données (estimation)

```
users:                  ~500 rows
categories:             ~50 rows
items:                  ~5,000 rows
item_metadata:          ~50,000 rows (EAV)
item_images:            ~8,000 rows
item_videos:            ~1,000 rows
item_audio:             ~500 rows
item_documents:         ~200 rows
───────────────────────────────────
Total rows:             ~65,000 rows
Total storage media:    ~50 GB
```

---

## 🔧 Script de Migration Complet

### Étape 1: Backup

```bash
#!/bin/bash
# scripts/01-backup-v1.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/migration-v1-to-v2"
DB_V1="snowshelf_v1"

mkdir -p $BACKUP_DIR

echo "🔒 Backup v1 database..."
mysqldump -h localhost \
  -u root \
  -p \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  $DB_V1 | gzip > $BACKUP_DIR/snowshelf_v1_${TIMESTAMP}.sql.gz

echo "📁 Backup v1 storage files..."
tar -czf $BACKUP_DIR/storage_v1_${TIMESTAMP}.tar.gz /var/www/snowshelf/storage

echo "✅ Backup completed: $BACKUP_DIR"
ls -lh $BACKUP_DIR
```

### Étape 2: Créer Schéma v2

```bash
#!/bin/bash
# scripts/02-create-schema-v2.sh

set -e

DB_V2="snowshelf_v2"

echo "🗄️ Creating v2 database schema..."
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS $DB_V2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "📋 Importing v2 schema..."
mysql -u root -p $DB_V2 < database/schema-v2.sql

echo "✅ v2 schema created"
```

### Étape 3: Migration Users

```sql
-- scripts/03-migrate-users.sql

-- Créer table temporaire pour mapping IDs
CREATE TABLE IF NOT EXISTS migration_user_mapping (
  old_id INT NOT NULL,
  new_id INT NOT NULL,
  PRIMARY KEY (old_id)
) ENGINE=InnoDB;

-- Migrer users avec nouveaux champs
INSERT INTO snowshelf_v2.users (
  username,
  email,
  password_hash,
  role,
  lang,
  theme,
  is_active,
  email_verified,
  created_at,
  updated_at
)
SELECT 
  u.username,
  u.email,
  -- Les anciens mots de passe devront être réinitialisés
  '$2b$12$MIGRATION.PLACEHOLDER.HASH.USERS.MUST.RESET.PASSWORD',
  CASE 
    WHEN u.role = 'admin' THEN 'admin'
    WHEN u.is_premium = 1 THEN 'premium'
    ELSE 'free'
  END as role,
  COALESCE(u.lang, 'fr') as lang,
  COALESCE(u.theme, 'default') as theme,
  u.is_active,
  u.email_verified,
  u.created_at,
  u.updated_at
FROM snowshelf_v1.users u;

-- Stocker mapping IDs
INSERT INTO migration_user_mapping (old_id, new_id)
SELECT u_old.id, u_new.id
FROM snowshelf_v1.users u_old
JOIN snowshelf_v2.users u_new ON u_old.email = u_new.email;

-- Afficher résumé
SELECT 
  COUNT(*) as total_migrated,
  SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
  SUM(CASE WHEN role = 'premium' THEN 1 ELSE 0 END) as premium,
  SUM(CASE WHEN role = 'free' THEN 1 ELSE 0 END) as free_users
FROM snowshelf_v2.users;
```

### Étape 4: Migration Categories

```sql
-- scripts/04-migrate-categories.sql

CREATE TABLE IF NOT EXISTS migration_category_mapping (
  old_id INT NOT NULL,
  new_id INT NOT NULL,
  PRIMARY KEY (old_id)
) ENGINE=InnoDB;

-- Migrer categories par défaut (is_default=1 dans v1)
INSERT INTO snowshelf_v2.categories (
  name,
  slug,
  description,
  icon,
  color,
  is_default,
  is_public,
  created_at,
  updated_at
)
SELECT 
  c.name,
  LOWER(REPLACE(c.name, ' ', '-')),
  c.description,
  c.icon,
  c.color,
  TRUE,
  TRUE,
  c.created_at,
  c.updated_at
FROM snowshelf_v1.categories c
WHERE c.is_default = 1
AND NOT EXISTS (SELECT 1 FROM snowshelf_v2.categories c2 WHERE c2.name = c.name AND c2.is_default = TRUE);

-- Migrer categories utilisateurs (non default)
INSERT INTO snowshelf_v2.categories (
  user_id,
  name,
  slug,
  description,
  icon,
  color,
  is_default,
  is_public,
  created_at,
  updated_at
)
SELECT 
  m.new_id as user_id,
  c.name,
  LOWER(REPLACE(c.name, ' ', '-')),
  c.description,
  c.icon,
  c.color,
  FALSE,
  FALSE,
  c.created_at,
  c.updated_at
FROM snowshelf_v1.categories c
JOIN migration_user_mapping m ON c.user_id = m.old_id
WHERE c.is_default = 0;

-- Mapping IDs
INSERT INTO migration_category_mapping (old_id, new_id)
SELECT c_old.id, c_new.id
FROM snowshelf_v1.categories c_old
JOIN snowshelf_v2.categories c_new 
  ON c_old.name = c_new.name;

-- Migrer hiérarchie par défaut (category_mothers_default v1 → category_relationships_default v2)
INSERT INTO snowshelf_v2.category_relationships_default (parent_id, child_id)
SELECT 
  mp.new_id as parent_id,
  mc.new_id as child_id
FROM snowshelf_v1.category_mothers_default cmd
JOIN migration_category_mapping mp ON cmd.mother_id = mp.old_id
JOIN migration_category_mapping mc ON cmd.category_id = mc.old_id;

-- Migrer hiérarchie par utilisateur (category_mothers v1 → category_relationships v2)
INSERT INTO snowshelf_v2.category_relationships (parent_id, child_id, user_id)
SELECT 
  mp.new_id as parent_id,
  mc.new_id as child_id,
  um.new_id as user_id
FROM snowshelf_v1.category_mothers cm
JOIN migration_category_mapping mp ON cm.mother_id = mp.old_id
JOIN migration_category_mapping mc ON cm.category_id = mc.old_id
JOIN migration_user_mapping um ON cm.user_id = um.old_id;

-- Résumé
SELECT COUNT(*) as total_categories FROM snowshelf_v2.categories;
SELECT COUNT(*) as total_relationships FROM snowshelf_v2.category_relationships;
SELECT COUNT(*) as total_default_relationships FROM snowshelf_v2.category_relationships_default;
```

### Étape 5: Migration Items

```sql
-- scripts/05-migrate-items.sql

CREATE TABLE IF NOT EXISTS migration_item_mapping (
  old_id INT NOT NULL,
  new_id INT NOT NULL,
  PRIMARY KEY (old_id)
) ENGINE=InnoDB;

-- Migrer items
INSERT INTO snowshelf_v2.items (
  user_id,
  category_id,
  primary_type_id,
  name,
  description,
  notes,
  purchase_date,
  purchase_price,
  current_value,
  quantity,
  barcode,
  is_favorite,
  is_wishlist,
  created_at,
  updated_at
)
SELECT 
  um.new_id as user_id,
  cm.new_id as category_id,
  i.primary_type_id,
  i.name,
  i.description,
  i.notes,
  i.purchase_date,
  i.purchase_price,
  i.current_value,
  i.quantity,
  i.barcode,
  i.is_favorite,
  i.is_wishlist,
  i.created_at,
  i.updated_at
FROM snowshelf_v1.items i
JOIN migration_user_mapping um ON i.user_id = um.old_id
LEFT JOIN migration_category_mapping cm ON i.category_id = cm.old_id;

-- Mapping IDs
INSERT INTO migration_item_mapping (old_id, new_id)
SELECT i_old.id, i_new.id
FROM snowshelf_v1.items i_old
JOIN snowshelf_v2.items i_new 
  ON i_old.name = i_new.name 
  AND i_old.user_id = (SELECT old_id FROM migration_user_mapping WHERE new_id = i_new.user_id)
  AND COALESCE(i_old.created_at, '1970-01-01') = COALESCE(i_new.created_at, '1970-01-01');

-- Résumé
SELECT 
  COUNT(*) as total_items,
  COUNT(DISTINCT user_id) as distinct_users,
  SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as favorites,
  SUM(CASE WHEN is_wishlist = 1 THEN 1 ELSE 0 END) as wishlist
FROM snowshelf_v2.items;
```

### Étape 6: Migration Metadata (EAV)

```sql
-- scripts/06-migrate-metadata.sql

-- Migrer primary_types (normalement identiques)
INSERT IGNORE INTO snowshelf_v2.primary_types 
SELECT * FROM snowshelf_v1.primary_types;

-- Migrer primary_type_fields (normalement identiques)
INSERT IGNORE INTO snowshelf_v2.primary_type_fields 
SELECT * FROM snowshelf_v1.primary_type_fields;

-- Migrer item_metadata
INSERT INTO snowshelf_v2.item_metadata (
  item_id,
  field_id,
  value_text,
  value_int,
  value_decimal,
  value_date,
  value_boolean
)
SELECT 
  im.new_id as item_id,
  m.field_id,
  m.value_text,
  m.value_int,
  m.value_decimal,
  m.value_date,
  m.value_boolean
FROM snowshelf_v1.item_metadata m
JOIN migration_item_mapping im ON m.item_id = im.old_id;

-- Résumé
SELECT 
  COUNT(*) as total_metadata_rows,
  COUNT(DISTINCT item_id) as items_with_metadata
FROM snowshelf_v2.item_metadata;
```

### Étape 7: Migration Media Files

```bash
#!/bin/bash
# scripts/07-migrate-media.sh

set -e

OLD_STORAGE="/var/www/snowshelf-v1/storage"
NEW_STORAGE="/var/www/snowshelf-v2/storage"

echo "📁 Creating new storage structure..."
mkdir -p $NEW_STORAGE/{images,videos,audio,documents}

# Fonction de migration avec nouveau naming
migrate_files() {
  local type=$1
  local old_dir="$OLD_STORAGE/$type"
  local new_dir="$NEW_STORAGE/$type"
  
  if [ -d "$old_dir" ]; then
    echo "📦 Migrating $type files..."
    
    # Copier avec préservation métadonnées
    rsync -av --progress "$old_dir/" "$new_dir/"
    
    echo "✅ $type migration completed"
    echo "   Files: $(find $new_dir -type f | wc -l)"
    echo "   Size: $(du -sh $new_dir | cut -f1)"
  else
    echo "⚠️  Directory not found: $old_dir"
  fi
}

migrate_files "images"
migrate_files "videos"
migrate_files "audio"
migrate_files "documents"

# Vérifier intégrité
echo "🔍 Verifying file integrity..."
diff -r $OLD_STORAGE $NEW_STORAGE || echo "⚠️  Differences detected, manual review needed"

# Permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data $NEW_STORAGE
chmod -R 755 $NEW_STORAGE

echo "✅ Media migration completed"
```

```sql
-- scripts/07-migrate-media-db.sql

-- Migrer item_images
INSERT INTO snowshelf_v2.item_images (
  item_id,
  filename,
  original_filename,
  mime_type,
  size_bytes,
  width,
  height,
  storage_path,
  is_primary,
  sort_order,
  uploaded_at
)
SELECT 
  im.new_id as item_id,
  i.filename,
  i.original_filename,
  i.mime_type,
  i.size_bytes,
  i.width,
  i.height,
  CONCAT('storage/images/', i.filename) as storage_path,
  i.is_primary,
  i.sort_order,
  i.uploaded_at
FROM snowshelf_v1.item_images i
JOIN migration_item_mapping im ON i.item_id = im.old_id;

-- Migrer item_videos
INSERT INTO snowshelf_v2.item_videos (
  item_id,
  filename,
  original_filename,
  mime_type,
  size_bytes,
  duration_seconds,
  width,
  height,
  storage_path,
  thumbnail_path,
  uploaded_at
)
SELECT 
  im.new_id as item_id,
  v.filename,
  v.original_filename,
  v.mime_type,
  v.size_bytes,
  v.duration_seconds,
  v.width,
  v.height,
  CONCAT('storage/videos/', v.filename) as storage_path,
  CONCAT('storage/videos/thumbs/', v.filename, '.jpg') as thumbnail_path,
  v.uploaded_at
FROM snowshelf_v1.item_videos v
JOIN migration_item_mapping im ON v.item_id = im.old_id;

-- Migrer item_audio (similaire)
INSERT INTO snowshelf_v2.item_audio (
  item_id,
  filename,
  original_filename,
  mime_type,
  size_bytes,
  duration_seconds,
  bitrate,
  storage_path,
  uploaded_at
)
SELECT 
  im.new_id as item_id,
  a.filename,
  a.original_filename,
  a.mime_type,
  a.size_bytes,
  a.duration_seconds,
  a.bitrate,
  CONCAT('storage/audio/', a.filename) as storage_path,
  a.uploaded_at
FROM snowshelf_v1.item_audio a
JOIN migration_item_mapping im ON a.item_id = im.old_id;

-- Migrer item_documents (similaire)
INSERT INTO snowshelf_v2.item_documents (
  item_id,
  filename,
  original_filename,
  mime_type,
  size_bytes,
  storage_path,
  uploaded_at
)
SELECT 
  im.new_id as item_id,
  d.filename,
  d.original_filename,
  d.mime_type,
  d.size_bytes,
  CONCAT('storage/documents/', d.filename) as storage_path,
  d.uploaded_at
FROM snowshelf_v1.item_documents d
JOIN migration_item_mapping im ON d.item_id = im.old_id;

-- Résumé média
SELECT 
  'Images' as type, COUNT(*) as count, 
  ROUND(SUM(size_bytes)/1024/1024, 2) as size_mb
FROM snowshelf_v2.item_images
UNION ALL
SELECT 
  'Videos' as type, COUNT(*) as count,
  ROUND(SUM(size_bytes)/1024/1024, 2) as size_mb
FROM snowshelf_v2.item_videos
UNION ALL
SELECT 
  'Audio' as type, COUNT(*) as count,
  ROUND(SUM(size_bytes)/1024/1024, 2) as size_mb
FROM snowshelf_v2.item_audio
UNION ALL
SELECT 
  'Documents' as type, COUNT(*) as count,
  ROUND(SUM(size_bytes)/1024/1024, 2) as size_mb
FROM snowshelf_v2.item_documents;
```

### Étape 8: Migration Tables Auxiliaires

```sql
-- scripts/08-migrate-auxiliary.sql

-- Storage locations
INSERT INTO snowshelf_v2.storage_locations (
  user_id,
  name,
  description,
  created_at
)
SELECT 
  um.new_id as user_id,
  sl.name,
  sl.description,
  sl.created_at
FROM snowshelf_v1.storage_locations sl
JOIN migration_user_mapping um ON sl.user_id = um.old_id;

-- Tako_Api config (nouvelle architecture)
-- Note: L'ancienne table web_api_providers n'est plus utilisée
-- Tako_Api remplace les 22 providers par une API unifiée
-- Les clés API sont gérées exclusivement dans le .env de Tako_Api
-- Aucune authentification n'est requise pour accéder à Tako_Api
INSERT INTO snowshelf_v2.tako_api_config (api_url, notes, is_active) VALUES
('http://localhost:3000', 'Tako_Api - Configuration par défaut (migration depuis v1)', TRUE);

-- Upload config (config globale)
INSERT IGNORE INTO snowshelf_v2.upload_config 
SELECT * FROM snowshelf_v1.upload_config;

-- Item grades (si existant)
CREATE TABLE IF NOT EXISTS migration_grade_mapping (
  old_id INT NOT NULL,
  new_id INT NOT NULL,
  PRIMARY KEY (old_id)
) ENGINE=InnoDB;

INSERT INTO snowshelf_v2.item_grades (
  user_id,
  name,
  abbreviation,
  description,
  sort_order,
  created_at
)
SELECT 
  um.new_id as user_id,
  ig.name,
  ig.abbreviation,
  ig.description,
  ig.sort_order,
  ig.created_at
FROM snowshelf_v1.item_grades ig
JOIN migration_user_mapping um ON ig.user_id = um.old_id;
```

---

## ✅ Validation de la Migration

### Script de Validation

```sql
-- scripts/09-validate-migration.sql

-- Validation counts
SELECT 'Users' as entity, 
  (SELECT COUNT(*) FROM snowshelf_v1.users) as v1_count,
  (SELECT COUNT(*) FROM snowshelf_v2.users) as v2_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM snowshelf_v1.users) = (SELECT COUNT(*) FROM snowshelf_v2.users)
    THEN '✅ OK'
    ELSE '❌ MISMATCH'
  END as status
UNION ALL
SELECT 'Categories',
  (SELECT COUNT(*) FROM snowshelf_v1.categories),
  (SELECT COUNT(*) FROM snowshelf_v2.categories),
  CASE 
    WHEN (SELECT COUNT(*) FROM snowshelf_v1.categories) = (SELECT COUNT(*) FROM snowshelf_v2.categories)
    THEN '✅ OK'
    ELSE '❌ MISMATCH'
  END
UNION ALL
SELECT 'Items',
  (SELECT COUNT(*) FROM snowshelf_v1.items),
  (SELECT COUNT(*) FROM snowshelf_v2.items),
  CASE 
    WHEN (SELECT COUNT(*) FROM snowshelf_v1.items) = (SELECT COUNT(*) FROM snowshelf_v2.items)
    THEN '✅ OK'
    ELSE '❌ MISMATCH'
  END
UNION ALL
SELECT 'Metadata',
  (SELECT COUNT(*) FROM snowshelf_v1.item_metadata),
  (SELECT COUNT(*) FROM snowshelf_v2.item_metadata),
  CASE 
    WHEN (SELECT COUNT(*) FROM snowshelf_v1.item_metadata) = (SELECT COUNT(*) FROM snowshelf_v2.item_metadata)
    THEN '✅ OK'
    ELSE '❌ MISMATCH'
  END
UNION ALL
SELECT 'Images',
  (SELECT COUNT(*) FROM snowshelf_v1.item_images),
  (SELECT COUNT(*) FROM snowshelf_v2.item_images),
  CASE 
    WHEN (SELECT COUNT(*) FROM snowshelf_v1.item_images) = (SELECT COUNT(*) FROM snowshelf_v2.item_images)
    THEN '✅ OK'
    ELSE '❌ MISMATCH'
  END;

-- Vérifier intégrité référentielle
SELECT 'Orphan items (no category)' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '⚠️  WARNING' END as status
FROM snowshelf_v2.items i
LEFT JOIN snowshelf_v2.categories c ON i.category_id = c.id
WHERE i.category_id IS NOT NULL AND c.id IS NULL
UNION ALL
SELECT 'Orphan metadata (no item)',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ ERROR' END
FROM snowshelf_v2.item_metadata m
LEFT JOIN snowshelf_v2.items i ON m.item_id = i.id
WHERE i.id IS NULL;

-- Sample data comparison
SELECT 'Sample comparison: First 5 items' as info;
SELECT i1.id as v1_id, i1.name as v1_name, i2.id as v2_id, i2.name as v2_name
FROM snowshelf_v1.items i1
JOIN migration_item_mapping m ON i1.id = m.old_id
JOIN snowshelf_v2.items i2 ON m.new_id = i2.id
LIMIT 5;
```

---

## 🔙 Plan de Rollback

### Rollback Complet

```bash
#!/bin/bash
# scripts/10-rollback.sh

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./rollback.sh <backup_file.sql.gz>"
  exit 1
fi

echo "⚠️  ROLLBACK: Restoring from $BACKUP_FILE"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Rollback cancelled"
  exit 0
fi

echo "🔄 Dropping v2 database..."
mysql -u root -p -e "DROP DATABASE IF EXISTS snowshelf_v2;"

echo "📥 Restoring v1 backup..."
gunzip < $BACKUP_FILE | mysql -u root -p

echo "🔄 Renaming v1 → v2..."
mysql -u root -p -e "CREATE DATABASE snowshelf_v2;"
mysqldump snowshelf_v1 | mysql snowshelf_v2

echo "✅ Rollback completed"
```

---

## 📋 Checklist de Migration

### Pré-Migration
- [ ] Backup complet v1 (BDD + fichiers)
- [ ] Tests migration sur données anonymisées
- [ ] Validation script sur environnement staging
- [ ] Notification utilisateurs (maintenance prévue)
- [ ] Plan de rollback testé

### Migration
- [ ] Activer mode maintenance
- [ ] Backup final v1
- [ ] Exécuter scripts migration (01-08)
- [ ] Validation counts (script 09)
- [ ] Tests smoke manuels
- [ ] Validation échantillon données

### Post-Migration
- [ ] Désactiver mode maintenance
- [ ] Monitoring actif (24h)
- [ ] Email utilisateurs (reset password)
- [ ] Tests complets fonctionnels
- [ ] Backup v2 initial

---

**Cette stratégie assure une migration sécurisée et exhaustive des données de SnowShelf v1 vers v2.**
