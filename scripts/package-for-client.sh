#!/bin/bash

# ═══════════════════════════════════════════════════════════
# SnowShelf v2 - Script de packaging pour client
# ═══════════════════════════════════════════════════════════
# Crée un package de déploiement prêt à livrer au client
# ═══════════════════════════════════════════════════════════

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  📦 SnowShelf v2 - Packaging pour client${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Vérifier qu'on est à la racine du projet
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Erreur : Ce script doit être exécuté depuis la racine du projet${NC}"
    exit 1
fi

# Nom du package
VERSION=${1:-$(date +%Y%m%d)}
PACKAGE_NAME="snowshelf-deploy-${VERSION}"
PACKAGE_DIR="dist/${PACKAGE_NAME}"

echo -e "${BLUE}📦 Création du package : ${PACKAGE_NAME}${NC}"
echo ""

# Créer le répertoire de destination
mkdir -p "${PACKAGE_DIR}"

# Copier les fichiers nécessaires
echo -e "${YELLOW}📋 Copie des fichiers de déploiement...${NC}"

cp docker-compose.prod.yml "${PACKAGE_DIR}/docker-compose.yml"
cp .env.production.example "${PACKAGE_DIR}/.env"
cp INSTALLATION.txt "${PACKAGE_DIR}/README.txt"

# Copier les scripts de base de données
mkdir -p "${PACKAGE_DIR}/database/seeds"
cp database/init.sql "${PACKAGE_DIR}/database/"
cp database/seeds/dev-seeds.sql "${PACKAGE_DIR}/database/seeds/"

echo -e "${GREEN}✓ Fichiers copiés${NC}"
echo ""

# Créer un script de démarrage simple
echo -e "${YELLOW}📝 Création du script de démarrage...${NC}"

cat > "${PACKAGE_DIR}/start.sh" << 'EOF'
#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "            ❄️  SnowShelf v2 - Démarrage"
echo "════════════════════════════════════════════════════════════"
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    echo "   Installez Docker : https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    echo "   Installez Docker Compose : https://docs.docker.com/compose/install/"
    exit 1
fi

# Vérifier .env
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env manquant"
    echo "   Copiez .env.example en .env et configurez-le"
    exit 1
fi

# Vérifier que les mots de passe ont été changés
if grep -q "CHANGE_ME" .env; then
    echo "⚠️  ATTENTION : Vous devez changer les mots de passe dans .env"
    echo "   Éditez le fichier .env et remplacez tous les 'CHANGE_ME_*'"
    echo ""
    read -p "Voulez-vous continuer quand même ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🚀 Démarrage de SnowShelf..."
echo ""

# Démarrer les services
docker-compose up -d

echo ""
echo "✅ SnowShelf est en cours de démarrage !"
echo ""
echo "📋 Vérification de l'état des services :"
sleep 5
docker-compose ps
echo ""
echo "🌐 Accès :"
echo "   Frontend : http://localhost"
echo "   Backend : http://localhost:3000"
echo "   API Docs : http://localhost:3000/api"
echo ""
echo "📖 Voir README.txt pour plus d'informations"
echo ""
EOF

chmod +x "${PACKAGE_DIR}/start.sh"

# Créer un script d'arrêt
cat > "${PACKAGE_DIR}/stop.sh" << 'EOF'
#!/bin/bash
echo "🛑 Arrêt de SnowShelf..."
docker-compose down
echo "✅ SnowShelf arrêté"
EOF

chmod +x "${PACKAGE_DIR}/stop.sh"

echo -e "${GREEN}✓ Scripts créés${NC}"
echo ""

# Créer l'archive
echo -e "${YELLOW}📦 Compression du package...${NC}"

cd dist
tar czf "${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}"
zip -r "${PACKAGE_NAME}.zip" "${PACKAGE_NAME}" > /dev/null

echo -e "${GREEN}✓ Archives créées${NC}"
echo ""

# Informations finales
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Package créé avec succès !${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📁 Emplacement : ${BLUE}dist/${PACKAGE_NAME}/${NC}"
echo ""
echo "📦 Archives disponibles :"
echo "   - ${PACKAGE_NAME}.tar.gz (Linux/Mac)"
echo "   - ${PACKAGE_NAME}.zip (Windows)"
echo ""
echo "📋 Contenu du package :"
echo "   ✅ docker-compose.yml (configuration production)"
echo "   ✅ .env (variables d'environnement à configurer)"
echo "   ✅ README.txt (instructions d'installation)"
echo "   ✅ start.sh (script de démarrage)"
echo "   ✅ stop.sh (script d'arrêt)"
echo "   ✅ database/ (scripts d'initialisation)"
echo ""
echo "🚀 Livrer au client :"
echo "   1. Envoyez l'archive ${PACKAGE_NAME}.tar.gz ou .zip"
echo "   2. Le client extrait l'archive"
echo "   3. Le client édite .env avec ses mots de passe"
echo "   4. Le client lance ./start.sh"
echo "   5. C'est tout ! ✨"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
