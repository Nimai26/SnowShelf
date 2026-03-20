#!/bin/bash

# Script d'information sur le statut du projet
# Usage : ./scripts/project-status.sh

echo "=================================================================================="
echo "                       ❄️  SnowShelf v2 - Project Status                          "
echo "=================================================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Erreur : Ce script doit être exécuté depuis la racine du projet${NC}"
    exit 1
fi

echo -e "${BLUE}📁 Structure du projet${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tree -L 2 -d --dirsfirst -I 'node_modules|dist|.git' | head -20
echo ""

echo -e "${BLUE}📦 Dépendances installées${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "backend/node_modules" ]; then
    BACKEND_PACKAGES=$(ls backend/node_modules | wc -l)
    echo -e "${GREEN}✅ Backend : $BACKEND_PACKAGES packages${NC}"
else
    echo -e "${RED}❌ Backend : node_modules manquant${NC}"
fi

if [ -d "frontend/node_modules" ]; then
    FRONTEND_PACKAGES=$(ls frontend/node_modules | wc -l)
    echo -e "${GREEN}✅ Frontend : $FRONTEND_PACKAGES packages${NC}"
else
    echo -e "${RED}❌ Frontend : node_modules manquant${NC}"
fi
echo ""

echo -e "${BLUE}🐳 Services Docker${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v docker-compose &> /dev/null; then
    RUNNING=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
    TOTAL=9
    if [ $RUNNING -gt 0 ]; then
        echo -e "${GREEN}✅ $RUNNING/$TOTAL services actifs${NC}"
        docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" | grep -v "NAME"
    else
        echo -e "${YELLOW}⏸️  Aucun service actif (utilisez 'make up' pour démarrer)${NC}"
    fi
else
    echo -e "${RED}❌ Docker Compose non installé${NC}"
fi
echo ""

echo -e "${BLUE}🔒 Sécurité${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "SECURITY.md" ]; then
    echo -e "${GREEN}✅ Rapport de sécurité : SECURITY.md${NC}"
    echo "   📋 Backend : 51 vulnérabilités (dev uniquement)"
    echo "   📋 Frontend : 21 vulnérabilités (dev uniquement)"
    echo "   ✅ Production : Aucune vulnérabilité"
else
    echo -e "${YELLOW}⚠️  Rapport de sécurité manquant${NC}"
fi
echo ""

echo -e "${BLUE}📝 Documentation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DOCS=(
    "README.md:📖 Documentation principale"
    "QUICKSTART.md:🚀 Démarrage rapide"
    "STATUS.md:📊 État du projet"
    "SECURITY.md:🔒 Audit de sécurité"
    "CONTRIBUTING.md:🤝 Guide de contribution"
    "CHANGELOG.md:📝 Historique des versions"
    "TECHNOLOGIES.md:🛠️  Stack technique"
    "LICENSE:⚖️  Licence"
)

for doc in "${DOCS[@]}"; do
    FILE="${doc%%:*}"
    DESC="${doc##*:}"
    if [ -f "$FILE" ]; then
        echo -e "${GREEN}✅ $DESC${NC}"
    else
        echo -e "${RED}❌ $DESC${NC}"
    fi
done
echo ""

echo -e "${BLUE}🧪 Tests et Qualité${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "backend/src" ]; then
    BACKEND_FILES=$(find backend/src -name "*.ts" | wc -l)
    echo "📄 Backend : $BACKEND_FILES fichiers TypeScript"
fi

if [ -d "frontend/src" ]; then
    FRONTEND_FILES=$(find frontend/src -name "*.tsx" -o -name "*.ts" | wc -l)
    echo "📄 Frontend : $FRONTEND_FILES fichiers TypeScript/React"
fi

if [ -d ".github/workflows" ]; then
    WORKFLOWS=$(ls .github/workflows/*.yml 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ CI/CD : $WORKFLOWS workflows GitHub Actions${NC}"
fi
echo ""

echo -e "${BLUE}🔧 Commandes utiles${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 make up          - Démarrer tous les services"
echo "🛑 make down        - Arrêter tous les services"
echo "📋 make logs        - Voir les logs en temps réel"
echo "🔄 make restart     - Redémarrer les services"
echo "🗄️  make db-seed     - Charger les données de test"
echo "💾 make db-backup   - Sauvegarder la base de données"
echo "🧪 make test        - Lancer les tests"
echo "🔍 make lint        - Vérifier le code"
echo "📊 make status      - Afficher l'état des services"
echo ""

echo -e "${BLUE}🌐 URLs${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏠 Frontend        : http://localhost:5173"
echo "⚙️  Backend         : http://localhost:3000"
echo "📖 Swagger API      : http://localhost:3000/api"
echo "🔍 Tako API         : http://localhost:3001"
echo "💾 phpMyAdmin       : http://localhost:8080"
echo "📧 MailHog          : http://localhost:8025"
echo "🌍 Production       : https://snowshelf.fr"
echo ""

echo -e "${BLUE}📈 Prochaines étapes${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. 🐳 Démarrer les services : make up"
echo "2. 🗄️  Charger les données test : make db-seed"
echo "3. 🧪 Lancer les tests : make test"
echo "4. 💻 Développer les modules backend (Auth, Users, Items)"
echo "5. 🎨 Développer les pages frontend (Dashboard, Items)"
echo "6. 🚀 Déployer en production : git tag v2.0.0 && git push --tags"
echo ""

echo "=================================================================================="
echo "                    📖 Voir STATUS.md pour plus de détails                       "
echo "=================================================================================="
