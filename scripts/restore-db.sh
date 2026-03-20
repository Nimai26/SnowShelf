#!/bin/bash
# Script de restauration de la base de données SnowShelf

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_CONTAINER="snowshelf_mariadb"
DB_NAME="${DB_DATABASE:-snowshelf_db}"
DB_USER="${DB_USERNAME:-snowshelf}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD non défini. Charger .env ou exporter la variable.}"
BACKUP_DIR="./database/backups"

# Afficher l'aide
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  echo "Usage: $0 [fichier_backup.sql.gz]"
  echo ""
  echo "Si aucun fichier n'est spécifié, le backup le plus récent sera utilisé."
  exit 0
fi

# Déterminer le fichier de backup à restaurer
if [ -n "$1" ]; then
  BACKUP_FILE="$1"
else
  # Trouver le backup le plus récent
  BACKUP_FILE=$(ls -t "$BACKUP_DIR"/snowshelf_*.sql.gz 2>/dev/null | head -n1)
  if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Aucun fichier de sauvegarde trouvé${NC}"
    exit 1
  fi
fi

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Le fichier $BACKUP_FILE n'existe pas${NC}"
  exit 1
fi

echo -e "${YELLOW}⚠️  ATTENTION : Cette opération va écraser la base de données actuelle${NC}"
echo -e "Fichier de restauration : $BACKUP_FILE"
read -p "Voulez-vous continuer ? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}⏸️  Restauration annulée${NC}"
  exit 0
fi

# Vérifier si le conteneur existe et est en cours d'exécution
if ! docker ps | grep -q "$DB_CONTAINER"; then
  echo -e "${RED}❌ Le conteneur $DB_CONTAINER n'est pas en cours d'exécution${NC}"
  exit 1
fi

echo -e "${YELLOW}🔄 Restauration de la base de données...${NC}"

# Décompresser et restaurer
if gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"; then
  echo -e "${GREEN}✅ Restauration réussie${NC}"
else
  echo -e "${RED}❌ Erreur lors de la restauration${NC}"
  exit 1
fi
