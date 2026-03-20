# ✅ Services SnowShelf - Démarrés !

Tous les services sont opérationnels ! 🎉

## 🌐 URLs d'accès (Développement)

### Applications principales

- **🏠 Frontend (React + Vite)**
  - URL : http://localhost:5173
  - Hot reload activé
  - TailwindCSS configuré

- **⚙️ Backend API (NestJS)**
  - URL : http://localhost:4000
  - Health check : http://localhost:4000/api/v1/health
  - **📖 Swagger API Docs** : http://localhost:4000/api/docs *(À configurer)*

- **🔍 Tako API (Recherche)**
  - URL : http://localhost:3002
  - 32 providers configurés
  - 11 domaines disponibles

### Outils de développement

- **💾 phpMyAdmin (MariaDB)**
  - URL : http://localhost:8081
  - User : `snowshelf`
  - Password : `snowshelf_password`
  - Database : `snowshelf_db`

- **📧 MailHog (Test emails)**
  - Interface web : http://localhost:8025
  - SMTP : localhost:1025

## 📦 Services Docker actifs

```
✅ snowshelf_frontend        - React + Vite (5173)
✅ snowshelf_backend         - NestJS API (4000)
✅ snowshelf_mariadb         - MariaDB 10.11 (3308)
✅ snowshelf_redis           - Redis 7 (6380)
✅ snowshelf_tako_api        - Tako API (3002)
✅ snowshelf_tako_postgres   - PostgreSQL 16 (5433)
✅ snowshelf_flaresolverr    - FlareSolverr (8192)
✅ snowshelf_phpmyadmin      - phpMyAdmin (8081)
✅ snowshelf_mailhog         - MailHog (8025)
```

## 🔧 Ports modifiés (pour éviter conflits)

⚠️ **Note** : Certains ports ont été changés car déjà utilisés par d'autres projets (hikari-mariadb, tako_api, hayate)

| Service | Port Standard | Port utilisé | Raison |
|---------|--------------|--------------|--------|
| Backend | 3000 | **4000** | tako_api utilise 3000 |
| MariaDB | 3306 | **3308** | hikari-mariadb utilise 3306 |
| Tako API | 3001 | **3002** | Par précaution |
| FlareSolverr | 8191 | **8192** | tako_flaresolverr utilise 8191 |
| phpMyAdmin | 8080 | **8081** | hayate utilise 8080 |
| Redis | 6379 | **6380** | Par précaution |
| Frontend | 5173 | **5173** | ✓ Libre |
| MailHog | 8025 | **8025** | ✓ Libre |

## ⚡ Commandes utiles

```bash
# Voir les logs en temps réel
make logs

# Logs d'un service spécifique
make logs-backend
make logs-frontend
make logs-tako

# Redémarrer un service
docker compose restart snowshelf_backend

# Arrêter tous les services
make down

# Statut des services
docker compose ps

# Accéder au shell backend
make shell

# Accéder à MariaDB
make db-shell
```

## 🗄️ Base de données

### État actuel
- ✅ MariaDB connectée
- ✅ Base `snowshelf_db` créée
- ⏳ Tables non créées (besoin de migration ou seed)

### Charger les données de test

```bash
# Option 1 : Via script SQL direct
docker compose exec snowshelf_mariadb mysql -u snowshelf -psnowshelf_password snowshelf_db < database/init.sql
docker compose exec snowshelf_mariadb mysql -u snowshelf -psnowshelf_password snowshelf_db < database/seeds/dev-seeds.sql

# Option 2 : Via make (quand migration/seed seront configurés)
make db-migration
make db-seed
```

## 📊 Comptes de test (une fois seedés)

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@snowshelf.fr | password123 | Admin |
| john.doe@example.com | password123 | User |
| jane.smith@example.com | password123 | User |

## 🚀 Prochaines étapes

### 1. ⏳ Charger les données de test
```bash
cd /Projets/SnowShelf
docker compose exec -T snowshelf_mariadb mysql -u snowshelf -psnowshelf_password snowshelf_db < database/init.sql
docker compose exec -T snowshelf_mariadb mysql -u snowshelf -psnowshelf_password snowshelf_db < database/seeds/dev-seeds.sql
```

### 2. 📖 Configurer Swagger
Le backend expose `/api/docs` mais Swagger doit être configuré dans `main.ts`

### 3. 💻 Développer les modules backend
- [ ] AuthModule (JWT, login, register)
- [ ] UsersModule (CRUD users, profils)
- [ ] ItemsModule (CRUD items, filtres)
- [ ] CategoriesModule (par domaine)
- [ ] MediaModule (upload images)
- [ ] TakoApiModule (intégration recherche)

### 4. 🎨 Développer les pages frontend
- [ ] Page de connexion/inscription
- [ ] Dashboard (stats, derniers items)
- [ ] Liste des items (filtres, pagination)
- [ ] Formulaire d'ajout/édition d'item
- [ ] Page de recherche (Tako API)
- [ ] Profil utilisateur

### 5. 🧪 Tests
- [ ] Tests unitaires backend (Jest)
- [ ] Tests E2E frontend
- [ ] Tests d'intégration API

### 6. 🚀 Déploiement
- [ ] Configurer GitHub Secrets (DOCKER_PASSWORD, DEPLOY_SSH_KEY)
- [ ] Pousser les images sur Docker Hub
- [ ] Déployer sur https://snowshelf.fr

## 🐛 Problèmes résolus

✅ **Port 3306 déjà utilisé** → Changé pour 3308  
✅ **Port 3000 déjà utilisé** → Changé pour 4000  
✅ **Port 8191 déjà utilisé** → Changé pour 8192  
✅ **Port 8080 déjà utilisé** → Changé pour 8081  
✅ **PostCSS ESM error** → Converti `module.exports` en `export default`  
✅ **Docker Compose v2** → Remplacé `docker-compose` par `docker compose`  
✅ **Backend DB connection** → Corrigé variables `DB_USERNAME` et `DB_DATABASE`  

## 📖 Documentation

- [README.md](README.md) - Vue d'ensemble
- [QUICKSTART.md](QUICKSTART.md) - Démarrage rapide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Guide de déploiement
- [SECURITY.md](SECURITY.md) - Audit de sécurité
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guide de contribution
- [WorkFLow/](WorkFLow/) - Documentation technique complète

---

**🎊 Le projet est prêt pour le développement !**

Commencez par charger les données de test, puis développez les modules backend et les pages frontend.

**Need help?** Consultez la [documentation complète](WorkFLow/README.md) ou [ouvrez une issue](https://github.com/Nimai26/SnowShelf2/issues).
