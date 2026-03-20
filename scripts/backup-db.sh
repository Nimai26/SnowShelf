#!/bin/bash
# Script de sauvegarde de la base de données et des fichiers SnowShelf

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DB_CONTAINER="snowshelf_mariadb"
DB_NAME="${DB_DATABASE:-snowshelf_db}"
DB_USER="${DB_USERNAME:-snowshelf}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD non défini. Charger .env ou exporter la variable.}"
BACKUP_DIR="./database/backups"
STORAGE_DIR="./storage/users"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/snowshelf_db_${TIMESTAMP}.sql"
MAX_BACKUPS=10

echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}  📦 Sauvegarde SnowShelf — $TIMESTAMP${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"

# Créer le dossier de backups si nécessaire
mkdir -p "$BACKUP_DIR"

# Vérifier si le conteneur existe et est en cours d'exécution
if ! docker ps | grep -q "$DB_CONTAINER"; then
  echo -e "${RED}❌ Le conteneur $DB_CONTAINER n'est pas en cours d'exécution${NC}"
  exit 1
fi

# ── 1. Backup base de données ──
echo -e "\n${YELLOW}🗄️  Sauvegarde de la base de données...${NC}"

if docker exec "$DB_CONTAINER" mysqldump \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"; then
  gzip "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE}.gz"
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo -e "${GREEN}✅ Base de données sauvegardée : $BACKUP_FILE ($SIZE)${NC}"
else
  echo -e "${RED}❌ Erreur lors de la sauvegarde de la BDD${NC}"
  exit 1
fi

# ── 2. Backup fichiers storage (si le dossier existe) ──
if [ -d "$STORAGE_DIR" ] && [ "$(ls -A "$STORAGE_DIR" 2>/dev/null)" ]; then
  echo -e "\n${YELLOW}📁 Sauvegarde des fichiers utilisateurs...${NC}"
  STORAGE_BACKUP="$BACKUP_DIR/snowshelf_storage_${TIMESTAMP}.tar.gz"
  
  if tar -czf "$STORAGE_BACKUP" -C "$(dirname "$STORAGE_DIR")" "$(basename "$STORAGE_DIR")" 2>/dev/null; then
    SIZE=$(du -h "$STORAGE_BACKUP" | cut -f1)
    echo -e "${GREEN}✅ Fichiers sauvegardés : $STORAGE_BACKUP ($SIZE)${NC}"
  else
    echo -e "${YELLOW}⚠️  Sauvegarde partielle des fichiers (certains fichiers ignorés)${NC}"
  fi
else
  echo -e "${YELLOW}ℹ️  Pas de fichiers utilisateurs à sauvegarder${NC}"
fi

# ── 3. Nettoyage des anciennes sauvegardes ──
echo -e "\n${YELLOW}🗑️  Nettoyage (conservation des $MAX_BACKUPS dernières)...${NC}"
cd "$BACKUP_DIR"
ls -t snowshelf_db_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
ls -t snowshelf_storage_*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
echo -e "${GREEN}✅ Nettoyage effectué${NC}"

# ── 4. Résumé ──
echo -e "\n${CYAN}═══════════════════════════════════════${NC}"
TOTAL=$(du -sh "$BACKUP_DIR" | cut -f1)
COUNT=$(ls "$BACKUP_DIR"/*.gz 2>/dev/null | wc -l)
echo -e "${GREEN}📊 Total backups : $COUNT fichiers ($TOTAL)${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
