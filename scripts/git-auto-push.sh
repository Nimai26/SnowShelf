#!/bin/bash
# ============================================
# SnowShelf - Script de mise à jour GitHub
# Commit et push automatique des modifications
# ============================================

# Configuration
REPO_PATH="/NAS/Data/Websites/SnowShelf"
DEFAULT_BRANCH="main"
LOG_FILE="$REPO_PATH/logs/git-auto-push.log"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    case $level in
        "INFO")  echo -e "${GREEN}[INFO]${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
        *)       echo -e "${BLUE}[$level]${NC} $message" ;;
    esac
}

# Vérifier qu'on est dans le bon répertoire
cd "$REPO_PATH" || {
    log "ERROR" "Impossible d'accéder à $REPO_PATH"
    exit 1
}

# Vérifier qu'il y a des modifications
if git diff --quiet && git diff --cached --quiet; then
    log "INFO" "Aucune modification à commiter"
    exit 0
fi

# Afficher les fichiers modifiés
log "INFO" "Fichiers modifiés:"
git status --short

# Message de commit
if [ -n "$1" ]; then
    # Message passé en argument
    COMMIT_MSG="$1"
else
    # Message automatique avec date et liste des fichiers
    CHANGED_FILES=$(git diff --name-only | head -5 | tr '\n' ', ' | sed 's/,$//')
    COMMIT_MSG="Auto-update $(date '+%Y-%m-%d %H:%M') - $CHANGED_FILES"
fi

log "INFO" "Message de commit: $COMMIT_MSG"

# Ajouter tous les fichiers modifiés
git add -A
if [ $? -ne 0 ]; then
    log "ERROR" "Échec de git add"
    exit 1
fi

# Commit
git commit -m "$COMMIT_MSG"
if [ $? -ne 0 ]; then
    log "ERROR" "Échec de git commit"
    exit 1
fi

log "INFO" "Commit créé avec succès"

# Push vers le dépôt distant
git push origin "$DEFAULT_BRANCH"
if [ $? -ne 0 ]; then
    log "WARN" "Push standard échoué, tentative avec --force..."
    git push --force origin "$DEFAULT_BRANCH"
    if [ $? -ne 0 ]; then
        log "ERROR" "Échec de git push"
        exit 1
    fi
fi

log "INFO" "Push vers GitHub réussi ✓"

# Afficher le dernier commit
echo ""
echo -e "${GREEN}=== Dernier commit ===${NC}"
git log -1 --oneline

exit 0
