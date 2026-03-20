# ════════════════════════════════════════════════════════════
# SnowShelf v2 - Makefile
# ════════════════════════════════════════════════════════════
#
# Usage rapide:
#   make setup    - Configuration initiale
#   make up       - Démarrer tous les services
#   make down     - Arrêter tous les services
#   make logs     - Voir les logs
#   make shell    - Shell backend
#
# ════════════════════════════════════════════════════════════

.PHONY: help setup up down restart logs shell clean test

# Couleurs pour l'affichage
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ Aide

help: ## Afficher cette aide
	@echo "$(BLUE)════════════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  SnowShelf v2 - Commandes Disponibles$(NC)"
	@echo "$(BLUE)════════════════════════════════════════════════════════════$(NC)"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""

##@ Configuration

setup: ## Configuration initiale du projet
	@echo "$(BLUE)🔧 Configuration initiale de SnowShelf...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)✓ Fichier .env créé depuis .env.example$(NC)"; \
		echo "$(YELLOW)⚠ Pensez à éditer .env avec vos propres valeurs$(NC)"; \
	else \
		echo "$(YELLOW)⚠ Le fichier .env existe déjà$(NC)"; \
	fi
	@echo "$(GREEN)✓ Configuration terminée$(NC)"

##@ Docker Compose

up: ## Démarrer tous les services
	@echo "$(BLUE)🚀 Démarrage de tous les services...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✓ Services démarrés$(NC)"
	@echo ""
	@echo "$(BLUE)Services disponibles:$(NC)"
	@echo "  • Frontend:        http://localhost:5173"
	@echo "  • Backend API:     http://localhost:4000"
	@echo "  • Tako_Api:        http://localhost:3002"
	@echo "  • Tako_Api Docs:   http://localhost:3002/docs"
	@echo "  • phpMyAdmin:      http://localhost:8081"
	@echo "  • MailHog:         http://localhost:8025"

down: ## Arrêter tous les services
	@echo "$(BLUE)🛑 Arrêt de tous les services...$(NC)"
	docker compose down
	@echo "$(GREEN)✓ Services arrêtés$(NC)"

restart: ## Redémarrer tous les services
	@echo "$(BLUE)🔄 Redémarrage de tous les services...$(NC)"
	docker compose restart
	@echo "$(GREEN)✓ Services redémarrés$(NC)"

rebuild: ## Reconstruire et redémarrer tous les services
	@echo "$(BLUE)🔨 Reconstruction de tous les services...$(NC)"
	docker compose down
	docker compose build --no-cache
	docker compose up -d
	@echo "$(GREEN)✓ Services reconstruits et redémarrés$(NC)"

##@ Logs & Monitoring

logs: ## Voir les logs de tous les services
	docker compose logs -f

logs-backend: ## Logs du backend
	docker compose logs -f snowshelf_backend

logs-frontend: ## Logs du frontend
	docker compose logs -f snowshelf_frontend

logs-tako: ## Logs de Tako_Api
	docker compose logs -f snowshelf_tako_api

logs-db: ## Logs de MariaDB
	docker compose logs -f snowshelf_mariadb

ps: ## Status des services
	@docker compose ps

stats: ## Statistiques Docker
	@docker stats --no-stream

##@ Shell & Accès

shell: ## Shell dans le container backend
	@docker compose exec snowshelf_backend sh

shell-db: ## Shell MySQL dans MariaDB
	@docker compose exec snowshelf_mariadb sh -c 'mysql -u"$$MYSQL_USER" -p"$$MYSQL_PASSWORD" "$$MYSQL_DATABASE"'

shell-redis: ## Shell Redis
	@docker compose exec snowshelf_redis sh -c 'redis-cli -a "$$REDIS_PASSWORD" --no-auth-warning'

shell-tako: ## Shell dans Tako_Api
	@docker compose exec snowshelf_tako_api sh

##@ Base de Données

db-migrate: ## Exécuter les migrations
	@echo "$(BLUE)🗄️  Exécution des migrations...$(NC)"
	docker compose exec snowshelf_backend npm run migration:run
	@echo "$(GREEN)✓ Migrations exécutées$(NC)"

db-seed: ## Peupler la base avec des données de test
	@echo "$(BLUE)🌱 Peuplement de la base...$(NC)"
	docker compose exec snowshelf_backend npm run seed
	@echo "$(GREEN)✓ Base peuplée$(NC)"

db-backup: ## Sauvegarder la base de données
	@echo "$(BLUE)💾 Sauvegarde de la base...$(NC)"
	@mkdir -p backups
	docker compose exec snowshelf_mariadb sh -c 'mysqldump --single-transaction -u"$$MYSQL_USER" -p"$$MYSQL_PASSWORD" "$$MYSQL_DATABASE"' > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Base sauvegardée dans backups/$(NC)"

db-restore: ## Restaurer la dernière sauvegarde (⚠️ écrase les données)
	@echo "$(RED)⚠️  ATTENTION: Cette opération va écraser la base actuelle!$(NC)"
	@echo "$(YELLOW)Appuyez sur Ctrl+C pour annuler, ou Entrée pour continuer...$(NC)"
	@read confirm
	@LATEST=$$(ls -t backups/*.sql | head -1); \
	if [ -z "$$LATEST" ]; then \
		echo "$(RED)✗ Aucune sauvegarde trouvée$(NC)"; \
	else \
		echo "$(BLUE)Restauration de $$LATEST...$(NC)"; \
		docker compose exec -T snowshelf_mariadb sh -c 'mysql -u"$$MYSQL_USER" -p"$$MYSQL_PASSWORD" "$$MYSQL_DATABASE"' < $$LATEST; \
		echo "$(GREEN)✓ Base restaurée$(NC)"; \
	fi

##@ Tests

test: ## Lancer tous les tests
	@echo "$(BLUE)🧪 Tests backend...$(NC)"
	docker compose exec snowshelf_backend npm run test
	@echo "$(BLUE)🧪 Tests frontend...$(NC)"
	docker compose exec snowshelf_frontend npm run test

test-e2e: ## Tests E2E
	@echo "$(BLUE)🧪 Tests E2E...$(NC)"
	docker compose exec snowshelf_backend npm run test:e2e

lint: ## Linter
	@echo "$(BLUE)🔍 Lint backend...$(NC)"
	docker compose exec snowshelf_backend npm run lint
	@echo "$(BLUE)🔍 Lint frontend...$(NC)"
	docker compose exec snowshelf_frontend npm run lint

##@ Nettoyage

clean: ## Nettoyer les containers et images
	@echo "$(BLUE)🧹 Nettoyage des containers...$(NC)"
	docker compose down -v
	docker system prune -f
	@echo "$(GREEN)✓ Nettoyage terminé$(NC)"

clean-all: ## Nettoyage complet (⚠️ supprime TOUTES les données)
	@echo "$(RED)⚠️  ATTENTION: Cette opération va supprimer TOUTES les données!$(NC)"
	@echo "$(YELLOW)Appuyez sur Ctrl+C pour annuler, ou Entrée pour continuer...$(NC)"
	@read confirm
	@echo "$(BLUE)🧹 Nettoyage complet...$(NC)"
	docker compose down -v --remove-orphans
	docker images --filter 'reference=*snowshelf*' -q | xargs -r docker rmi -f
	docker volume ls --filter 'name=snowshelf' -q | xargs -r docker volume rm
	@echo "$(GREEN)✓ Nettoyage complet terminé$(NC)"

##@ Développement

dev-backend: ## Développement backend (sans Docker)
	@echo "$(BLUE)💻 Démarrage backend en mode dev...$(NC)"
	cd backend && npm run start:dev

dev-frontend: ## Développement frontend (sans Docker)
	@echo "$(BLUE)💻 Démarrage frontend en mode dev...$(NC)"
	cd frontend && npm run dev

install: ## Installer les dépendances (sans Docker)
	@echo "$(BLUE)📦 Installation des dépendances...$(NC)"
	cd backend && npm install
	cd frontend && npm install
	@echo "$(GREEN)✓ Dépendances installées$(NC)"

##@ Utilitaires

tako-test: ## Tester Tako_Api
	@echo "$(BLUE)🐙 Test Tako_Api...$(NC)"
	@echo "Recherche jeux vidéo 'zelda':"
	@curl -s "http://localhost:3002/api/videogames/search?q=zelda" | jq '.'

tako-domains: ## Liste des domaines Tako_Api
	@echo "$(BLUE)🐙 Domaines Tako_Api disponibles:$(NC)"
	@curl -s "http://localhost:3002/api/domains" | jq '.domains[].id'

health: ## Vérifier la santé des services
	@echo "$(BLUE)💚 Vérification de la santé des services...$(NC)"
	@echo "Backend:      $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/health)"
	@echo "Frontend:     $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5173)"
	@echo "Tako_Api:     $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3002/health)"
	@echo "phpMyAdmin:   $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8081)"

watch: ## Surveiller les logs des services principaux
	@watch -n 2 "docker compose ps && echo && docker stats --no-stream"

##@ Sécurité

audit: ## Audit de sécurité (npm audit)
	@echo "$(BLUE)🔒 Audit de sécurité...$(NC)"
	@echo "$(YELLOW)Backend:$(NC)"
	@cd backend && npm audit || true
	@echo "\n$(YELLOW)Frontend:$(NC)"
	@cd frontend && npm audit || true
	@echo "\n$(GREEN)✓ Audit terminé - Voir SECURITY.md pour l'analyse$(NC)"

audit-fix: ## Tenter de corriger les vulnérabilités automatiquement
	@echo "$(BLUE)🔧 Correction des vulnérabilités...$(NC)"
	@echo "$(YELLOW)Backend:$(NC)"
	@cd backend && npm audit fix || true
	@echo "\n$(YELLOW)Frontend:$(NC)"
	@cd frontend && npm audit fix || true
	@echo "\n$(YELLOW)⚠ Les vulnérabilités non corrigées nécessitent 'npm audit fix --force'$(NC)"
	@echo "$(YELLOW)⚠ Cela peut introduire des breaking changes$(NC)"

security-report: ## Afficher le rapport de sécurité
	@echo "$(BLUE)🔒 Rapport de sécurité SnowShelf$(NC)"
	@if [ -f SECURITY.md ]; then \
		cat SECURITY.md | head -50; \
	else \
		echo "$(RED)❌ SECURITY.md introuvable$(NC)"; \
	fi

##@ Informations

status: ## Afficher l'état complet du projet
	@./scripts/project-status.sh

urls: ## Afficher toutes les URLs
	@echo "$(BLUE)🌐 URLs disponibles:$(NC)"
	@echo "$(GREEN)Frontend:$(NC)       http://localhost:5173"
	@echo "$(GREEN)Backend:$(NC)        http://localhost:3000"
	@echo "$(GREEN)Swagger API:$(NC)    http://localhost:3000/api"
	@echo "$(GREEN)Tako API:$(NC)       http://localhost:3001"
	@echo "$(GREEN)phpMyAdmin:$(NC)     http://localhost:8080"
	@echo "$(GREEN)MailHog:$(NC)        http://localhost:8025"
	@echo "$(GREEN)Production:$(NC)     https://snowshelf.fr"

##@ Production

build-prod: ## Build les images Docker de production
	@echo "$(BLUE)🏗️  Build des images de production...$(NC)"
	docker build -t nimai24/snowshelf2-backend:latest ./backend
	docker build -t nimai24/snowshelf2-frontend:latest --build-arg VITE_API_URL=https://snowshelf.fr ./frontend
	@echo "$(GREEN)✓ Images buildées$(NC)"

push-prod: build-prod ## Build et push les images sur Docker Hub
	@echo "$(BLUE)📤 Push des images sur Docker Hub...$(NC)"
	docker push nimai24/snowshelf2-backend:latest
	docker push nimai24/snowshelf2-frontend:latest
	@echo "$(GREEN)✓ Images poussées sur Docker Hub$(NC)"

test-prod: ## Tester le déploiement production en local
	@echo "$(BLUE)🧪 Démarrage de la configuration production...$(NC)"
	docker compose -f docker compose.prod.yml up -d
	@echo "$(GREEN)✓ Services démarrés en mode production$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:80$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:3000$(NC)"

package: ## Créer un package de déploiement pour le client
	@./scripts/package-for-client.sh

deploy-info: ## Afficher les informations de déploiement
	@echo "$(BLUE)════════════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  📦 Stratégie de déploiement SnowShelf$(NC)"
	@echo "$(BLUE)════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)DÉVELOPPEMENT (vous):$(NC)"
	@echo "  1. make up                    - Dev avec hot reload"
	@echo "  2. git push                   - Push le code"
	@echo "  3. git tag v2.0.0 && git push - GitHub Actions build les images"
	@echo "  4. Images Docker Hub prêtes   - nimai24/snowshelf2-*"
	@echo ""
	@echo "$(YELLOW)PRODUCTION (client):$(NC)"
	@echo "  1. Télécharge le package      - snowshelf-deploy-*.tar.gz"
	@echo "  2. Édite .env                 - Configure les mots de passe"
	@echo "  3. ./start.sh                 - Lance l'application"
	@echo "  4. C'est tout ! ✅"
	@echo ""
	@echo "$(GREEN)Les images Docker contiennent déjà tout (npm install, build, etc.)$(NC)"
	@echo "$(GREEN)Le client n'a RIEN à compiler !$(NC)"
	@echo ""
	@echo "📖 Voir DEPLOYMENT.md pour plus de détails"
	@echo ""

.DEFAULT_GOAL := help
