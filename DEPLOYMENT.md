# 🚀 Guide de Déploiement - SnowShelf v2

Ce guide explique comment déployer SnowShelf en production pour un client final.

## 📦 Workflow complet

```
┌─────────────────────────────────────────────────────────────┐
│  DÉVELOPPEUR (vous)                                         │
├─────────────────────────────────────────────────────────────┤
│  1. Code + npm install (local)                              │
│  2. git push                                                 │
│  3. GitHub Actions build les images Docker                  │
│  4. Push sur Docker Hub : nimai24/snowshelf2-*              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Images prêtes sur Docker Hub
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (déploiement final)                                 │
├─────────────────────────────────────────────────────────────┤
│  1. Télécharge docker-compose.prod.yml + .env               │
│  2. Lance : docker-compose -f docker-compose.prod.yml up -d │
│  3. C'est tout ! ✅                                          │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Ce que reçoit le client

Le client reçoit simplement **3 fichiers** :

```
snowshelf-deploy/
├── docker-compose.prod.yml   # Configuration Docker
├── .env                       # Variables d'environnement (à éditer)
└── README.txt                 # Instructions simples
```

## 📋 Instructions pour le client

### Prérequis

- ✅ Docker 20.10+ installé
- ✅ Docker Compose 2.0+ installé
- ✅ Connexion internet

### Installation en 3 étapes

```bash
# 1. Éditer le fichier .env avec les mots de passe
nano .env

# 2. Démarrer l'application
docker-compose -f docker-compose.prod.yml up -d

# 3. Vérifier que tout fonctionne
docker-compose -f docker-compose.prod.yml ps
```

**C'est tout !** L'application est accessible sur http://localhost:80

### Configuration NGINX Proxy Manager

Si le client utilise NGINX Proxy Manager (recommandé) :

1. Créer un Proxy Host :
   - **Domain Names** : `snowshelf.fr`
   - **Scheme** : `http`
   - **Forward Hostname / IP** : `snowshelf_frontend`
   - **Forward Port** : `80`

2. Créer un second Proxy Host pour l'API :
   - **Domain Names** : `snowshelf.fr`
   - **Scheme** : `http`
   - **Forward Hostname / IP** : `snowshelf_backend`
   - **Forward Port** : `3000`
   - **Custom locations** : `/api/`

3. Activer SSL (Let's Encrypt) sur les deux

## 🔧 Workflow développeur (ce que VOUS faites)

### 1. Développement local

```bash
# Développement avec hot reload
make up
cd backend && npm run start:dev
cd frontend && npm run dev
```

### 2. Build des images Docker

Quand vous êtes prêt à livrer une nouvelle version :

```bash
# Option 1 : Tag git (déclenche GitHub Actions automatiquement)
git tag v2.0.0
git push origin v2.0.0

# Option 2 : Build manuel local
docker build -t nimai24/snowshelf2-backend:latest ./backend
docker build -t nimai24/snowshelf2-frontend:latest ./frontend

# Push sur Docker Hub
docker push nimai24/snowshelf2-backend:latest
docker push nimai24/snowshelf2-frontend:latest
```

### 3. GitHub Actions (automatique)

Quand vous push un tag `v*`, GitHub Actions :

1. ✅ Lance les tests backend et frontend
2. ✅ Build les images Docker de production
3. ✅ Push sur Docker Hub (nimai24/snowshelf2-*)
4. ✅ Les images sont prêtes pour le client

Voir [.github/workflows/docker-build.yml](.github/workflows/docker-build.yml)

## 📦 Images Docker Hub

Les images finales sont hébergées sur :

- **Backend** : `docker pull nimai24/snowshelf2-backend:latest`
- **Frontend** : `docker pull nimai24/snowshelf2-frontend:latest`

Ces images sont **multi-stage** :
- ✅ Optimisées (petite taille)
- ✅ Sécurisées (utilisateur non-root)
- ✅ Health checks intégrés
- ✅ Tout est pré-compilé (pas de npm install côté client)

## 🏗️ Architecture des images

### Backend (NestJS)

```dockerfile
# Stage 1: Builder
- npm ci (install deps)
- npm run build (compile TypeScript)
- npm prune --production (garde que prod deps)

# Stage 2: Runner
- Copie dist/ et node_modules/
- Image finale : ~150 MB
- Utilisateur non-root
- Health check intégré
```

### Frontend (React + NGINX)

```dockerfile
# Stage 1: Builder
- npm ci (install deps)
- npm run build (compile React + Vite)

# Stage 2: Runner (NGINX)
- Copie dist/ dans NGINX
- Image finale : ~25 MB
- Gzip, cache headers
- Health check intégré
```

## 🔄 Mise à jour chez le client

Quand vous livrez une nouvelle version :

```bash
# Le client fait juste :
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Docker télécharge les nouvelles images et redémarre
```

**Pas de npm install, pas de recompilation, rien !**

## 🎯 Différences Dev vs Prod

| Aspect | Développement | Production |
|--------|--------------|------------|
| **Dockerfile** | `Dockerfile.dev` | `Dockerfile` |
| **Node modules** | Local (hot reload) | Dans l'image (compilé) |
| **Build** | À chaque changement | 1 fois (dans l'image) |
| **Taille image** | ~800 MB | ~150 MB (backend), ~25 MB (frontend) |
| **npm install** | ✅ Requis | ❌ Pas nécessaire |
| **Sécurité** | Utilisateur root | Utilisateur non-root |
| **Health checks** | Basiques | Avancés |

## 🛡️ Sécurité Production

Les images de production ont :

- ✅ **Multi-stage build** : Pas de fichiers de build dans l'image finale
- ✅ **Utilisateur non-root** : `nestjs` (1001) et `nginx`
- ✅ **Dumb-init** : Gestion correcte des signaux
- ✅ **Health checks** : Surveillance automatique
- ✅ **NGINX hardened** : Headers de sécurité, gzip, cache

## 📝 Fichier README.txt pour le client

```txt
═══════════════════════════════════════════════════════════
            ❄️  SnowShelf v2 - Installation
═══════════════════════════════════════════════════════════

PRÉREQUIS
---------
- Docker 20.10+
- Docker Compose 2.0+

INSTALLATION
------------
1. Éditer le fichier .env :
   - Changer tous les mots de passe (CHANGE_ME_*)
   - Adapter l'URL si nécessaire

2. Démarrer l'application :
   docker-compose -f docker-compose.prod.yml up -d

3. Vérifier que tout fonctionne :
   docker-compose -f docker-compose.prod.yml ps

ACCÈS
-----
- Application web : http://localhost
- API Backend : http://localhost:3000
- Documentation API : http://localhost:3000/api

COMMANDES UTILES
----------------
Voir les logs :
  docker-compose -f docker-compose.prod.yml logs -f

Arrêter :
  docker-compose -f docker-compose.prod.yml down

Redémarrer :
  docker-compose -f docker-compose.prod.yml restart

Mettre à jour :
  docker-compose -f docker-compose.prod.yml pull
  docker-compose -f docker-compose.prod.yml up -d

SUPPORT
-------
Email : admin@snowshelf.fr
Documentation : https://github.com/Nimai26/SnowShelf2
═══════════════════════════════════════════════════════════
```

## 🎊 Résumé

**Pour vous (développeur) :**
- ✅ Développement local avec hot reload
- ✅ npm install local (pour l'IDE)
- ✅ Push → GitHub Actions build et push les images

**Pour le client :**
- ✅ Télécharge docker-compose.prod.yml + .env
- ✅ Lance une seule commande
- ✅ **Pas de npm install, rien à compiler**

**Les images Docker contiennent déjà tout ce qui est nécessaire !**

---

**Questions ?** Voir [CONTRIBUTING.md](CONTRIBUTING.md) ou contactez l'équipe.
