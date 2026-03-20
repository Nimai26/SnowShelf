# 📚 SnowShelf v2 - Plan de Développement Complet

> **Documentation exhaustive** pour la réécriture complète de SnowShelf en application web moderne (PWA) et mobile native (iOS/Android)

---

## 🎯 Objectif du Projet

Transformer SnowShelf (application PHP vanilla de gestion de collections geek) en une application moderne avec :
- **Backend API** : NestJS + TypeScript + MariaDB
- **Frontend Web** : React 18 + PWA + Tailwind CSS
- **Mobile** : React Native (iOS + Android)
- **Infrastructure** : Kubernetes + CI/CD + Monitoring

---

## �️ Environnement de Développement

### Configuration Actuelle

- **Infrastructure** : Proxmox VM → Debian (environnement de labo 10.20.0.3)
- **Reverse Proxy** : NGINX Proxy Manager (10.0.0.9:81)
- **URL définitive** : https://snowshelf.fr (production)
- **Répertoire projet** : `/Projets/SnowShelf`
- **Projet existant** : `.Back_up/` (ancien projet PHP pour référence)
- **Documentation** : `WorkFLow/` (ce dossier)

### Tako_Api - API de Recherche Unifiée

SnowShelf utilise **Tako_Api**, une API unifiée développée en interne pour la recherche multi-sources.

- **Emplacement** : `/Projets/Tako_Api`
- **Architecture** : 32 providers répartis en 11 domaines métier
- **Domaines** : construction-toys, books, comics, anime-manga, media, videogames, boardgames, collectibles, tcg, music, ecommerce
- **Documentation** : OpenAPI disponible sur `http://localhost:3002/docs` (en dev)
- **Cache** : PostgreSQL intégré (93% réduction latence)
- **Traduction** : Support multi-langue automatique
- **Version** : 2.0.1 (adaptation terminée février 2026)

Cette API remplace les 22 fournisseurs externes de la version précédente avec une architecture moderne et unifiée.

### Prérequis

- Node.js 20+
- npm 10+
- Docker & Docker Compose
- Git
- MariaDB 10.11+ (ou via Docker)
- Redis 7+ (ou via Docker)

---

## �📋 Documentation Disponible

### 📑 [00-INDEX.md](./00-INDEX.md)
**Table des matières complète** - Point d'entrée de la documentation avec checkslist d'utilisation

### 📊 [01-ANALYSE_PROJET_EXISTANT.md](./01-ANALYSE_PROJET_EXISTANT.md)
**Analyse approfondie du projet PHP actuel**
- Architecture existante (PHP 8.x, MariaDB, JavaScript vanilla)
- Fonctionnalités complètes (43 thèmes, i18n, EAV, Tako_Api avec 32 providers)
- Points forts & limitations
- Décisions de refonte justifiées

### 🏗️ [02-ARCHITECTURE_GENERALE.md](./02-ARCHITECTURE_GENERALE.md)
**Vision architecturale globale**
- Architecture API-First
- Diagrammes systèmes (clients → API → backend → BDD)
- Flux de données
- Patterns de conception (Repository, DTO, Guards)

### 🛠️ [03-STACK_TECHNIQUE_DETAILLEE.md](./03-STACK_TECHNIQUE_DETAILLEE.md)
**Choix technologiques complets avec justifications**
- Backend : NestJS, TypeORM, Redis, JWT
- Frontend Web : React 18, Vite, Tailwind CSS, Zustand
- Mobile : React Native, Expo
- Infrastructure : Kubernetes, MariaDB 10.11, Prometheus, Grafana
- Exemples de configuration pour chaque techno

### 🌐 [04-API_REST_SPECIFICATION.md](./04-API_REST_SPECIFICATION.md)
**Spécification complète de l'API REST**
- 40+ endpoints documentés (Auth, Users, Categories, Items, Media, Search, Admin)
- Exemples requêtes/réponses JSON
- Codes d'erreur standardisés
- Pagination, filtrage, tri
- Rate limiting par endpoint

### 🗄️ [05-BASE_DE_DONNEES_SCHEMA.md](./05-BASE_DE_DONNEES_SCHEMA.md)
**Schéma de base de données MariaDB complet**
- 20+ tables avec relations détaillées
- Index optimisés pour performance
- Triggers automatiques (counts, soft delete)
- Scripts SQL de création
- Stratégies d'optimisation (partitioning, caching)

### 🔐 [06-SECURITE_AUTHENTIFICATION.md](./06-SECURITE_AUTHENTIFICATION.md)
**Guide complet de sécurité**
- Authentification JWT double-token (access 15min + refresh 7 jours)
- Hachage bcrypt (cost 12)
- Rate limiting & brute force protection
- Protection CSRF, XSS, SQL injection
- Sécurité des uploads (validation MIME, ClamAV)
- Logs de sécurité

### 🗺️ [07-ROADMAP_FONCTIONNALITES.md](./07-ROADMAP_FONCTIONNALITES.md)
**Plan de développement phasé (20 semaines)**
- Phase 0 : Setup (2 sem) — ✅ TERMINÉ
- Phase 1 : Foundation - Auth & Users (4 sem) — ✅ TERMINÉ (Sprint 1 & 2)
- Phase 2 : Core Features - Collections (6 sem) — 🚧 Sprint 3 TERMINÉ, Sprint 4-6 à faire
- Phase 3 : Advanced - Web Search & Editor (4 sem)
- Phase 4 : Mobile App (4 sem)
- Phase 5 : Production Hardening (2 sem)
- Priorisation P0/P1/P2/P3
- Métriques de succès par phase

### 🚀 [08-DEPLOIEMENT_INFRASTRUCTURE.md](./08-DEPLOIEMENT_INFRASTRUCTURE.md)
**Guide DevOps complet**
- Docker & Docker Compose (environnement dev)
- Kubernetes (staging/production)
  - ConfigMaps, Secrets
  - Deployments, Services, StatefulSets
  - HorizontalPodAutoscaler
  - Ingress NGINX + cert-manager
- CI/CD GitHub Actions
- Monitoring (Prometheus, Grafana)
- Backup & recovery automatisés

### 🧪 [09-STRATEGIE_TESTS.md](./09-STRATEGIE_TESTS.md)
**Stratégie de tests exhaustive**
- Tests unitaires (Jest) : >80% coverage backend, >75% frontend
- Tests d'intégration (Supertest)
- Tests E2E (Playwright pour web, Detox pour mobile)
- Load testing (k6)
- Security testing (OWASP ZAP)
- Exemples de code pour chaque type de test

### 🔄 [10-MIGRATION_DONNEES.md](./10-MIGRATION_DONNEES.md)
**Guide de migration v1 → v2**
- Analyse des données existantes (~65k rows, ~50GB media)
- Scripts SQL de migration complets (users, categories, items, metadata, media)
- Migration des fichiers avec rsync
- Validation automatisée des données
- Plan de rollback testé
- Checklist pré/post-migration

### 💻 [11-GUIDE_DEVELOPPEMENT.md](./11-GUIDE_DEVELOPPEMENT.md)
**Bonnes pratiques de développement**
- Conventions de nommage (camelCase, PascalCase, kebab-case)
- Standards de code (NestJS services/controllers, React components/hooks)
- Documentation JSDoc
- Git workflow (branches, commits conventionnels)
- Pull Request template
- Checklist code review

---

## 📊 Métriques du Projet

### Estimation Développement

| Composant | Lignes de Code (estimé) |
|-----------|-------------------------|
| Backend (NestJS) | ~15,000 LOC |
| Frontend Web (React) | ~12,000 LOC |
| Mobile (React Native) | ~8,000 LOC |
| Tests | ~10,000 LOC |
| **Total** | **~45,000 LOC** |

### Effort Estimé

| Phase | Durée | Équipe |
|-------|-------|--------|
| Setup & Foundation | 6 semaines | 2-3 devs |
| Core Features | 6 semaines | 4 devs |
| Advanced Features | 4 semaines | 3 devs |
| Mobile App | 4 semaines | 2 devs |
| **Total** | **20 semaines** | **3-4 devs** |

**Charge totale** : ~16 homme-mois

---

## 🚀 Démarrage Rapide

### Pour les Développeurs

1. **📖 Lire la documentation**
   - Commencer par [00-INDEX.md](./00-INDEX.md)
   - [01-ANALYSE_PROJET_EXISTANT.md](./01-ANALYSE_PROJET_EXISTANT.md) pour contexte
   - [02-ARCHITECTURE_GENERALE.md](./02-ARCHITECTURE_GENERALE.md) pour vision

2. **⚙️ Setup environnement**
   - Suivre [03-STACK_TECHNIQUE_DETAILLEE.md](./03-STACK_TECHNIQUE_DETAILLEE.md)
   - Installer Docker, Node.js 20, pnpm
   - Cloner repo et lancer `docker-compose up`

3. **💻 Développer**
   - API : [04-API_REST_SPECIFICATION.md](./04-API_REST_SPECIFICATION.md)
   - BDD : [05-BASE_DE_DONNEES_SCHEMA.md](./05-BASE_DE_DONNEES_SCHEMA.md)
   - Sécurité : [06-SECURITE_AUTHENTIFICATION.md](./06-SECURITE_AUTHENTIFICATION.md)
   - Code : [11-GUIDE_DEVELOPPEMENT.md](./11-GUIDE_DEVELOPPEMENT.md)

4. **🧪 Tester**
   - Suivre [09-STRATEGIE_TESTS.md](./09-STRATEGIE_TESTS.md)
   - Coverage minimum 80%

### Pour les Product Owners

1. **📋 Planification**
   - [07-ROADMAP_FONCTIONNALITES.md](./07-ROADMAP_FONCTIONNALITES.md) : Phases & Sprints
   - Priorisation P0 (critiques) → P1 (importantes) → P2 (nice to have)

2. **📊 Suivi**
   - Métriques de succès par phase
   - Jalons (Milestones) M1 à M6

### Pour les DevOps/SRE

1. **🏗️ Infrastructure**
   - [08-DEPLOIEMENT_INFRASTRUCTURE.md](./08-DEPLOIEMENT_INFRASTRUCTURE.md)
   - Kubernetes configs (dev/staging/prod)
   - CI/CD pipelines

2. **📊 Monitoring**
   - Prometheus + Grafana dashboards
   - Alerting PagerDuty
   - Backup automatisé

3. **🔄 Migration**
   - [10-MIGRATION_DONNEES.md](./10-MIGRATION_DONNEES.md)
   - Scripts testés sur données anonymisées

---

## 📁 Structure de la Documentation

```
WorkFLow/
├── 00-INDEX.md                          # Table des matières
├── 01-ANALYSE_PROJET_EXISTANT.md       # Analyse v1
├── 02-ARCHITECTURE_GENERALE.md          # Architecture v2
├── 03-STACK_TECHNIQUE_DETAILLEE.md      # Technologies
├── 04-API_REST_SPECIFICATION.md         # Endpoints API
├── 05-BASE_DE_DONNEES_SCHEMA.md         # Schéma BDD
├── 06-SECURITE_AUTHENTIFICATION.md      # Sécurité
├── 07-ROADMAP_FONCTIONNALITES.md        # Planning
├── 08-DEPLOIEMENT_INFRASTRUCTURE.md     # DevOps
├── 09-STRATEGIE_TESTS.md                # Tests
├── 10-MIGRATION_DONNEES.md              # Migration
├── 11-GUIDE_DEVELOPPEMENT.md            # Bonnes pratiques
└── README.md                             # Ce fichier
```

---

## ✅ Statut de la Documentation

| Document | Statut | Complétude |
|----------|---------|-----------|
| 00-INDEX.md | ✅ Complet | 100% |
| 01-ANALYSE_PROJET_EXISTANT.md | ✅ Complet | 100% |
| 02-ARCHITECTURE_GENERALE.md | ✅ Complet | 100% |
| 03-STACK_TECHNIQUE_DETAILLEE.md | ✅ Complet | 100% |
| 04-API_REST_SPECIFICATION.md | 🚧 En cours | 90% (endpoints implémentés notés) |
| 05-BASE_DE_DONNEES_SCHEMA.md | ✅ Complet | 100% |
| 06-SECURITE_AUTHENTIFICATION.md | ✅ Complet | 100% |
| 07-ROADMAP_FONCTIONNALITES.md | 🚧 Mis à jour | Sprint 0-3 terminés |
| 08-DEPLOIEMENT_INFRASTRUCTURE.md | ✅ Complet | 100% |
| 09-STRATEGIE_TESTS.md | ✅ Complet | 100% |
| 10-MIGRATION_DONNEES.md | ✅ Complet | 100% |
| 11-GUIDE_DEVELOPPEMENT.md | ✅ Complet | 100% |

**Total** : ~30,000 lignes de documentation technique

---

## 🎯 Prochaines Étapes

1. ✅ **Documentation complète** (20 février 2026)
2. ✅ **Setup environnement dev** (Sprint 0 — 20/02/2026)
3. ✅ **Sprint 1 — Auth & Users** (21/02/2026)
4. ✅ **Sprint 2 — User Experience** (22/02/2026) — 43 thèmes, i18n FR/EN, design system
5. ✅ **Sprint 3 — Categories & PrimaryTypes** (22/02/2026) — CRUD catégories, 11 types, ~90 champs
6. ⏳ **Sprint 4 — Items** — CRUD items, métadonnées EAV, uploads
7. ⏳ **Sprint 5+ — Média, Recherche, Tako_Api**

---

## 📞 Contacts & Ressources

### Équipe Projet
- **Tech Lead** : Nimai
- **Product Owner** : Nimai
- **DevOps** : Nimai

### Liens Utiles
- **Repository** : https://github.com/Nimai26/SnowShelf
- **CI/CD** : https://github.com/Nimai26/SnowShelf/actions
- **Staging** : https://staging.snowshelf.fr
- **Production** : https://snowshelf.fr
- **Dev Frontend** : http://10.20.0.3:5173
- **Dev Backend** : http://10.20.0.3:4000
- **Dev MailHog** : http://10.20.0.3:8025
- **Dev phpMyAdmin** : http://10.20.0.3:8081

---

## 📝 Versions

| Date | Version | Changements |
|------|---------|-------------|
| 2026-02-20 | 1.0.0 | Création complète de la documentation (12 documents) |
| 2026-02-21 | 1.1.0 | Sprint 1 terminé — Auth & Users |
| 2026-02-22 | 1.2.0 | Sprint 2 terminé — UX, thèmes, i18n, design system, emails |
| 2026-02-22 | 1.3.0 | Sprint 3 terminé — Categories, PrimaryTypes |

---

**Cette documentation constitue la référence complète et exhaustive pour le développement de SnowShelf v2.**

*Créé avec ❤️ pour faciliter la réécriture et assurer le succès du projet.*
