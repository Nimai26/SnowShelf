# Guide de Démarrage Rapide - SnowShelf v2

Ce guide vous permet de démarrer rapidement le développement sur SnowShelf v2.

## 📋 Prérequis

- Docker & Docker Compose installés
- Node.js 20+ (pour développement local hors Docker)
- Git configuré avec accès au dépôt

## 🚀 Démarrage en 5 minutes

### 1. Cloner le projet

```bash
git clone https://github.com/Nimai26/SnowShelf2.git
cd SnowShelf2
```

### 2. Configurer les variables d'environnement

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Démarrer tous les services

```bash
# Tout démarrer avec Docker Compose
make up

# Ou directement avec docker-compose
docker-compose up -d
```

### 4. Initialiser la base de données

```bash
# Attendre que MariaDB soit prêt (environ 30 secondes)
sleep 30

# Exécuter les seeds de développement
make db-seed
```

### 5. Accéder aux services

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Interface React |
| **Backend API** | http://localhost:4000 | API NestJS |
| **Swagger** | http://localhost:4000/api/docs | Documentation API |
| **phpMyAdmin** | http://localhost:8081 | Gestion BDD |
| **MailHog** | http://localhost:8025 | Emails de test |
| **Tako API** | http://localhost:3002 | API de recherche |

## 🧑‍💻 Développement

### Commandes Make disponibles

```bash
# Services
make up              # Démarrer tous les services
make down            # Arrêter tous les services
make restart         # Redémarrer tous les services
make logs            # Voir les logs de tous les services
make logs-backend    # Logs du backend uniquement
make logs-frontend   # Logs du frontend uniquement

# Base de données
make db-shell        # Accéder au shell MariaDB
make db-backup       # Créer une sauvegarde
make db-seed         # Exécuter les seeds de développement

# Backend
make backend-shell   # Shell dans le conteneur backend
make backend-install # Installer les dépendances backend
make backend-test    # Lancer les tests backend

# Frontend
make frontend-shell  # Shell dans le conteneur frontend
make frontend-install # Installer les dépendances frontend

# Tako API
make tako-test       # Tester Tako API

# Nettoyage
make clean           # Supprimer les volumes (ATTENTION: perte de données)
make prune           # Nettoyer Docker (images, volumes non utilisés)
```

### Développement local (hors Docker)

#### Backend

```bash
cd backend
npm install
npm run start:dev
```

L'API sera disponible sur http://localhost:3000

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'interface sera disponible sur http://localhost:5173

## 📚 Comptes de test

Après avoir exécuté les seeds, vous pouvez utiliser ces comptes :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@snowshelf.fr | password123 | Admin |
| john.doe@example.com | password123 | User |
| jane.smith@example.com | password123 | User |

## 🧪 Tests

### Backend (NestJS)

```bash
cd backend

# Tests unitaires
npm test

# Tests en mode watch
npm run test:watch

# Couverture de code
npm run test:cov

# Tests E2E
npm run test:e2e
```

### Frontend (React)

```bash
cd frontend

# Linter
npm run lint

# Build de production
npm run build
```

## 🗄️ Base de données

### Accès phpMyAdmin

URL : http://localhost:8080

- **Serveur** : `snowshelf_mariadb`
- **Utilisateur** : `snowshelf_user`
- **Mot de passe** : `snowshelf_password`
- **Base** : `snowshelf_db`

### Migrations TypeORM

```bash
cd backend

# Générer une migration
npm run migration:generate -- src/database/migrations/NomMigration

# Créer une migration vide
npm run migration:create -- src/database/migrations/NomMigration

# Exécuter les migrations
npm run migration:run

# Annuler la dernière migration
npm run migration:revert
```

## 🔍 Tako API

Tako API fournit 32 providers de recherche sur 11 domaines :

1. **construction-toys** (LEGO, K'NEX, etc.)
2. **videogames** (Jeux vidéo, consoles)
3. **books** (Livres)
4. **comics** (BD, comics)
5. **anime-manga** (Mangas, anime)
6. **media** (Films, séries)
7. **boardgames** (Jeux de société)
8. **collectibles** (Figurines, objets rares)
9. **tcg** (Cartes à collectionner)
10. **music** (CD, vinyles)
11. **ecommerce** (Produits généraux)

### Tester Tako API

```bash
# Via curl
curl http://localhost:3002/search/web?query=lego&domain=construction-toys

# Via le Makefile
make tako-test
```

> **Note** : Tako API ne nécessite aucune authentification. Les clés API des providers externes sont gérées exclusivement dans le `.env` de Tako_Api (injectées via `docker-compose.yml`).

## 📖 Documentation

- **[Architecture Générale](WorkFLow/02-ARCHITECTURE_GENERALE.md)** : Vue d'ensemble du système
- **[Stack Technique](WorkFLow/03-STACK_TECHNIQUE_DETAILLEE.md)** : Technologies utilisées
- **[API Specification](WorkFLow/04-API_REST_SPECIFICATION.md)** : Endpoints de l'API
- **[Base de Données](WorkFLow/05-BASE_DE_DONNEES_SCHEMA.md)** : Schéma complet
- **[Déploiement](WorkFLow/08-DEPLOIEMENT_INFRASTRUCTURE.md)** : Guide de déploiement

## 🐛 Debugging

### Voir les logs d'un service

```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f snowshelf_mariadb
```

### Accéder au shell d'un conteneur

```bash
# Backend
docker exec -it snowshelf_backend sh

# Frontend
docker exec -it snowshelf_frontend sh

# Base de données
docker exec -it snowshelf_mariadb bash
```

### Redémarrer un service spécifique

```bash
docker-compose restart backend
docker-compose restart frontend
```

## 🔧 Problèmes courants

### Le port 3000/5173/... est déjà utilisé

```bash
# Trouver le processus utilisant le port
lsof -i :3000

# Tuer le processus
kill -9 <PID>
```

### Les dépendances ne sont pas à jour

```bash
# Backend
docker-compose exec backend npm install

# Frontend
docker-compose exec frontend npm install
```

### La base de données ne démarre pas

```bash
# Voir les logs
docker-compose logs snowshelf_mariadb

# Supprimer le volume et recréer
docker-compose down -v
docker-compose up -d snowshelf_mariadb
```

## 🌐 Déploiement en production

Voir [08-DEPLOIEMENT_INFRASTRUCTURE.md](WorkFLow/08-DEPLOIEMENT_INFRASTRUCTURE.md) pour les détails complets.

### Quick deploy

```bash
# Sur le serveur de production
cd /Projets/SnowShelf
git pull origin main
docker-compose -f docker-compose.prod.yml up -d
```

## � Déploiement Production vs Développement

### ⚙️ Mode Développement (ce guide)

```bash
# Ce que vous faites :
make up              # Démarre avec Dockerfile.dev
npm install          # Installe localement pour l'IDE
npm run start:dev    # Hot reload
```

**Caractéristiques :**
- ✅ Hot reload automatique
- ✅ Node_modules en local
- ✅ Outils de debug
- ✅ Seed data automatique

### 🚀 Mode Production (déploiement client)

```bash
# Ce que le CLIENT fait (ultra simple) :
./start.sh           # C'est tout !
```

**Caractéristiques :**
- ✅ Images Docker pré-compilées sur Docker Hub
- ✅ Aucun npm install nécessaire
- ✅ Tout est déjà buildé dans les images
- ✅ Le client télécharge juste les images et lance

**Images Docker Hub :**
- `nimai24/snowshelf2-backend:latest` (~150 MB)
- `nimai24/snowshelf2-frontend:latest` (~25 MB)

### 📦 Créer un package pour le client

```bash
# Générer le package de déploiement
make package

# Cela crée :
dist/snowshelf-deploy-YYYYMMDD/
├── docker-compose.yml
├── .env (à configurer)
├── README.txt
├── start.sh
└── stop.sh
```

Envoyez l'archive au client, il n'a qu'à :
1. Extraire l'archive
2. Éditer `.env` avec ses mots de passe
3. Lancer `./start.sh`

**Le client n'a JAMAIS besoin de faire `npm install` !**

📖 **Guide complet** : Voir [DEPLOYMENT.md](DEPLOYMENT.md)

## �📞 Support

- **Documentation** : Dossier `WorkFLow/`
- **Issues GitHub** : https://github.com/Nimai26/SnowShelf2/issues
- **Email** : admin@snowshelf.fr

## ✅ Checklist de démarrage

- [ ] Docker et Docker Compose installés
- [ ] Projet cloné depuis GitHub
- [ ] Fichiers `.env` configurés
- [ ] Services démarrés avec `make up`
- [ ] Base de données seedée avec `make db-seed`
- [ ] Frontend accessible sur http://localhost:5173
- [ ] Backend accessible sur http://localhost:3000
- [ ] Connexion réussie avec un compte de test
- [ ] Tako API fonctionnelle (test avec `make tako-test`)

## 🎉 Vous êtes prêt !

Vous pouvez maintenant commencer à développer sur SnowShelf v2 !

Pour toute question, consultez la documentation dans le dossier `WorkFLow/` ou créez une issue sur GitHub.
