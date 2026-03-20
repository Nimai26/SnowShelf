# ❄️ SnowShelf v2

> Application de gestion de collections universelle avec recherche multi-providers via Tako API

[![Backend CI](https://github.com/Nimai26/SnowShelf2/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/Nimai26/SnowShelf2/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/Nimai26/SnowShelf2/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/Nimai26/SnowShelf2/actions/workflows/frontend-ci.yml)
[![Docker Build](https://github.com/Nimai26/SnowShelf2/actions/workflows/docker-build.yml/badge.svg)](https://github.com/Nimai26/SnowShelf2/actions/workflows/docker-build.yml)
[![Security](https://img.shields.io/badge/security-audited-green.svg)](SECURITY.md)

## 📖 Documentation

- 📋 [**Démarrage rapide**](QUICKSTART.md) - Lancer le projet en 5 minutes
- � [**Déploiement**](DEPLOYMENT.md) - Guide de déploiement production
- �📊 [**État du projet**](STATUS.md) - Progression et checklist
- 🔒 [**Sécurité**](SECURITY.md) - Audit et recommandations
- 🤝 [**Contribuer**](CONTRIBUTING.md) - Guide de contribution
- 📝 [**Changelog**](CHANGELOG.md) - Historique des versions
- 🛠️ [**Technologies**](TECHNOLOGIES.md) - Stack technique complète

## 🌟 Fonctionnalités

- 🔍 **Recherche multi-providers** : 32+ providers sur 11 domaines via Tako API
- 📚 **Gestion de collections** : Articles, catégories, médias, métadonnées EAV
- 👥 **Multi-utilisateurs** : Authentification JWT, rôles (admin, premium, user)
- 👫 **Système d'amis** : Demandes d'ami, ajout par email, politique de confidentialité
- 🌍 **Collections publiques** : Exploration des profils et collections d'autres utilisateurs
- 📷 **Scan & OCR** : Ajout par code-barres (EAN/ISBN/UPC) et reconnaissance de texte
- 🖼️ **Gestion de médias** : Upload images/vidéos/documents, thumbnails WebP
- 📊 **Statistiques** : Valeur totale, nombre d'articles, graphiques analytics
- 🌐 **PWA** : Installation mobile/desktop, mode offline, push notifications
- 🔒 **Sécurisé** : Helmet, CORS, CSP, validation des données, rate limiting
- 📖 **API documentée** : Swagger UI intégré
- 🎨 **43 thèmes** : Personnalisation complète de l'interface
- 🌍 **i18n** : Français et anglais

## 🏗️ Architecture

```
SnowShelf v2
├── Backend (NestJS + TypeScript + TypeORM)
├── Frontend (React 18 + Vite + TailwindCSS)
├── Database (MariaDB 10.11)
├── Cache (Redis 7)
├── Tako API (32 providers, 11 domaines)
│   ├── PostgreSQL (cache)
│   └── FlareSolverr (anti-bot)
└── Mail (MailHog - dev)
```

## 📋 Prérequis

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Node.js** 20+ (pour développement sans Docker)
- **Git**

## 🚀 Démarrage Rapide

### 1. Cloner les projets

```bash
# SnowShelf (ce projet)
cd /Projets
git clone <url> SnowShelf
cd SnowShelf

# Tako_Api (API de recherche)
cd /Projets
git clone <url> Tako_Api
```

### 2. Configuration

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer les variables si nécessaire
nano .env  # ou vim, code, etc.
```

### 3. Démarrer les services

```bash
# Démarrer tous les services en arrière-plan
docker-compose up -d

# Voir les logs de tous les services
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f snowshelf_backend
docker-compose logs -f snowshelf_tako_api
```

### 4. Accéder aux services

Une fois tous les services démarrés, vous pouvez accéder à :

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:4000
- **Swagger API Docs** : http://localhost:4000/api/docs
- **Tako_Api** : http://localhost:3002
- **Tako_Api Docs** : http://localhost:3002/docs
- **phpMyAdmin** : http://localhost:8081 (MariaDB)
- **MailHog (emails)** : http://localhost:8025
- **FlareSolverr** : http://localhost:8192

### 5. Initialiser la base de données

```bash
# Accéder au container backend
docker-compose exec snowshelf_backend sh

# Lancer les migrations
npm run migration:run

# Créer un utilisateur admin
npm run seed:admin
```

## 🛠️ Commandes Utiles

### Docker Compose

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ perte de données)
docker-compose down -v

# Reconstruire un service
docker-compose build snowshelf_backend

# Redémarrer un service
docker-compose restart snowshelf_backend

# Voir les services en cours
docker-compose ps

# Voir les logs en temps réel
docker-compose logs -f

# Accéder au shell d'un container
docker-compose exec snowshelf_backend sh
docker-compose exec snowshelf_mariadb mysql -u snowshelf -p
```

### Développement Backend

```bash
# Installer les dépendances
cd backend
npm install

# Développement avec hot reload
npm run start:dev

# Build production
npm run build

# Lancer les tests
npm run test
npm run test:e2e

# Linter
npm run lint
npm run format
```

### Développement Frontend

```bash
# Installer les dépendances
cd frontend
npm install

# Développement avec hot reload
npm run dev

# Build production
npm run build

# Preview du build
npm run preview

# Lancer les tests
npm run test
```

### Tako_Api

```bash
# Démarrer Tako_Api en standalone (sans Docker)
cd /Projets/Tako_Api
npm install
npm run dev

# Tester un endpoint
curl http://localhost:3002/api/videogames/search?q=zelda

# Voir la documentation OpenAPI
open http://localhost:3002/docs
```

## 📊 Services & Ports

| Service | Port(s) | Container Name | Description |
|---------|---------|----------------|-------------|
| Frontend | 5173 | `snowshelf_frontend` | React PWA |
| Backend | 4000 | `snowshelf_backend` | NestJS API |
| MariaDB | 3308 | `snowshelf_mariadb` | Base de données |
| phpMyAdmin | 8081 | `snowshelf_phpmyadmin` | Interface web MariaDB |
| Redis | 6380 | `snowshelf_redis` | Cache & sessions |
| Tako_Api | 3002 | `snowshelf_tako_api` | API recherche unifiée |
| PostgreSQL | 5433 | `snowshelf_tako_postgres` | Cache Tako_Api |
| FlareSolverr | 8192 | `snowshelf_flaresolverr` | Bypass Cloudflare |
| MailHog | 1025, 8025 | `snowshelf_mailhog` | Tests emails |

## 🗄️ Volumes de Données

Les données persistantes sont stockées dans des volumes Docker :

- `snowshelf_mariadb_data` : Base de données (~50 GB)
- `snowshelf_tako_postgres_data` : Cache Tako_Api (~5 GB)
- `snowshelf_redis_data` : Cache Redis (~1 GB)
- `snowshelf_storage_data` : Médias utilisateurs (~100 GB)

### Sauvegarder les données

```bash
# Sauvegarder MariaDB
docker-compose exec snowshelf_mariadb mysqldump -u snowshelf -psnowshelf_password snowshelf_db > backup_$(date +%Y%m%d).sql

# Sauvegarder les volumes
docker run --rm -v snowshelf_storage_data:/data -v $(pwd):/backup alpine tar czf /backup/storage_backup.tar.gz /data
```

### Restaurer les données

```bash
# Restaurer MariaDB
docker-compose exec -T snowshelf_mariadb mysql -u snowshelf -psnowshelf_password snowshelf_db < backup_20260222.sql
```

## �️ Utiliser phpMyAdmin

phpMyAdmin est disponible sur http://localhost:8081 pour consulter et gérer la base de données MariaDB.

### Connexion

- **Serveur** : `snowshelf_mariadb` (ou laisser vide)
- **Utilisateur** : `snowshelf`
- **Mot de passe** : `snowshelf_password`

### Fonctionnalités disponibles

- **Consulter** : Parcourir toutes les tables (users, items, categories, etc.)
- **Requêtes SQL** : Exécuter des requêtes personnalisées
- **Import/Export** : Importer ou exporter des données (SQL, CSV, JSON)
- **Structure** : Modifier la structure des tables
- **Rechercher** : Rechercher dans toutes les tables
- **Visualisation** : Graphiques et statistiques

### Commandes utiles depuis phpMyAdmin

```sql
-- Voir tous les utilisateurs
SELECT id, name, email, is_admin, is_premium, created_at FROM users;

-- Compter les items par utilisateur
SELECT u.name, COUNT(i.id) as total_items 
FROM users u 
LEFT JOIN items i ON u.id = i.user_id 
GROUP BY u.id;

-- Voir les catégories les plus utilisées
SELECT c.name, COUNT(ic.item_id) as usage_count 
FROM categories c 
LEFT JOIN item_categories ic ON c.id = ic.category_id 
GROUP BY c.id 
ORDER BY usage_count DESC 
LIMIT 10;
```

## �🐛 Dépannage

### Les containers ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Vérifier l'état des services
docker-compose ps

# Nettoyer et redémarrer
docker-compose down -v
docker-compose up -d
```

### Erreur de connexion à Tako_Api

```bash
# Vérifier que Tako_Api est démarré
docker-compose logs snowshelf_tako_api

# Vérifier depuis le backend
docker-compose exec snowshelf_backend curl http://snowshelf_tako_api:3002/health
```

### Problème de permissions sur les volumes

```bash
# Depuis le host
sudo chown -R 1000:1000 ./backend/storage
```

### FlareSolverr sature la mémoire

FlareSolverr est limité à 3 sessions simultanées et 2 GB de RAM. Si problème :

```bash
# Redémarrer FlareSolverr
docker-compose restart snowshelf_flaresolverr

# Vérifier l'utilisation
docker stats snowshelf_flaresolverr
```

## 📚 Documentation Complète

La documentation détaillée se trouve dans le dossier `WorkFLow/` :

- [00-INDEX.md](WorkFLow/00-INDEX.md) - Table des matières
- [01-ANALYSE_PROJET_EXISTANT.md](WorkFLow/01-ANALYSE_PROJET_EXISTANT.md) - Analyse du projet
- [02-ARCHITECTURE_GENERALE.md](WorkFLow/02-ARCHITECTURE_GENERALE.md) - Architecture
- [03-STACK_TECHNIQUE_DETAILLEE.md](WorkFLow/03-STACK_TECHNIQUE_DETAILLEE.md) - Stack technique
- [04-API_REST_SPECIFICATION.md](WorkFLow/04-API_REST_SPECIFICATION.md) - Spécifications API
- [05-BASE_DE_DONNEES_SCHEMA.md](WorkFLow/05-BASE_DE_DONNEES_SCHEMA.md) - Schéma BDD
- [06-SECURITE_AUTHENTIFICATION.md](WorkFLow/06-SECURITE_AUTHENTIFICATION.md) - Sécurité
- [07-ROADMAP_FONCTIONNALITES.md](WorkFLow/07-ROADMAP_FONCTIONNALITES.md) - Roadmap
- [08-DEPLOIEMENT_INFRASTRUCTURE.md](WorkFLow/08-DEPLOIEMENT_INFRASTRUCTURE.md) - Déploiement
- [09-STRATEGIE_TESTS.md](WorkFLow/09-STRATEGIE_TESTS.md) - Tests
- [10-MIGRATION_DONNEES.md](WorkFLow/10-MIGRATION_DONNEES.md) - Migration (archive v1)
- [11-GUIDE_DEVELOPPEMENT.md](WorkFLow/11-GUIDE_DEVELOPPEMENT.md) - Guide dev
- [SPRINT19_CATEGORY_FIELDS.md](WorkFLow/SPRINT19_CATEGORY_FIELDS.md) - Champs custom
- [SPRINT20_SCAN_IMAGE_SEARCH.md](WorkFLow/SPRINT20_SCAN_IMAGE_SEARCH.md) - Scan/OCR

## 🌐 URLs de Production

- **Site web** : https://snowshelf.fr
- **API** : https://api.snowshelf.fr
- **Reverse Proxy** : NGINX Proxy Manager (10.0.0.9:81)

## 📞 Support

Pour toute question ou problème :
- Consulter la documentation dans `WorkFLow/`
- Vérifier les logs : `docker-compose logs -f`
- Vérifier les issues GitHub

---

**SnowShelf v2** - Application de gestion de collections geek  
Développé avec ❤️ par l'équipe SnowShelf
