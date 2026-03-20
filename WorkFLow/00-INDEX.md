# 📚 INDEX - Documentation SnowShelf v2

> **Table des matières complète** - Navigation dans la documentation
> 
> **Date de création** : 20 février 2026
> **Dernière mise à jour** : 20 mars 2026
> **Version** : 2.5.0
> **Status** : ✅ Documentation complète

---

## 🎯 Vue d'Ensemble du Projet

**SnowShelf v2** est une réécriture complète de l'application de gestion de collections geek, transformée en application web moderne (PWA) installable sur mobile.

### 🔄 Transition v1 → v2

| Aspect | v1 (Actuel) | v2 (Cible) |
|--------|-------------|------------|
| **Backend** | PHP 8.x vanilla | NestJS + TypeScript |
| **Frontend** | JavaScript vanilla SPA | React 18 + TypeScript + PWA |
| **Mobile** | Web responsive uniquement | PWA installable (Android + iOS) |
| **Base de données** | MariaDB 10.x | MariaDB 10.11 (optimisée) |
| **Architecture** | Monolithique | API-First, modulaire |
| **Déploiement** | Docker simple | Docker Compose (dev) + production ready |
| **Tests** | Aucun | Tests unitaires, intégration, E2E |

---

## 📖 Structure de la Documentation

### 🎨 Documentation Principale

#### [01-ANALYSE_PROJET_EXISTANT.md](./01-ANALYSE_PROJET_EXISTANT.md)
**Analyse approfondie du projet actuel**
- ✅ Architecture existante PHP
- ✅ Fonctionnalités actuelles (43 thèmes, i18n, EAV)
- ✅ Points forts & limitations
- ✅ Décisions de refonte

**Usage** : Comprendre l'état actuel avant la migration  
**Public** : Tous les développeurs du projet

---

#### [02-ARCHITECTURE_GENERALE.md](./02-ARCHITECTURE_GENERALE.md)
**Vision architecturale globale**
- ✅ Architecture API-First
- ✅ Diagrammes systèmes
- ✅ Flux de données
- ✅ Principes de conception

**Usage** : Référence pour décisions techniques  
**Public** : Architectes, Tech Leads

---

#### [03-STACK_TECHNIQUE_DETAILLEE.md](./03-STACK_TECHNIQUE_DETAILLEE.md)
**Choix technologiques justifiés**
- ✅ Backend: NestJS, TypeORM, Redis, Sharp, web-push
- ✅ Frontend Web: React 18, Tailwind CSS, Zustand, Framer Motion
- ✅ Mobile: PWA (Workbox, Web Push, Web Share)
- ✅ Infrastructure: Docker Compose, MariaDB 10.11, Redis 7

**Usage** : Setup environnement développement  
**Public** : Tous les développeurs

---

#### [04-API_REST_SPECIFICATION.md](./04-API_REST_SPECIFICATION.md)
**Spécification complète de l'API REST**
- ✅ Tous les endpoints (Auth, Users, Categories, Items, Media, Admin)
- ✅ Exemples requêtes/réponses JSON
- ✅ Codes d'erreur
- ✅ Pagination, filtrage, tri
- ✅ Rate limiting

**Usage** : Contrat API entre backend et frontends  
**Public** : Backend & Frontend developers

---

#### [05-BASE_DE_DONNEES_SCHEMA.md](./05-BASE_DE_DONNEES_SCHEMA.md)
**Schéma de base de données complet**
- ✅ 20+ tables avec relations
- ✅ Index et contraintes
- ✅ Triggers automatiques
- ✅ Scripts SQL de création
- ✅ Stratégies d'optimisation

**Usage** : Référence pour requêtes et migrations  
**Public** : Backend developers, DBAs

---

#### [06-SECURITE_AUTHENTIFICATION.md](./06-SECURITE_AUTHENTIFICATION.md)
**Guide complet de sécurité**
- ✅ JWT double-token (access + refresh)
- ✅ Hachage bcrypt
- ✅ Rate limiting & brute force protection
- ✅ Protection CSRF, XSS, SQL injection
- ✅ Sécurité des uploads

**Usage** : Implémentation sécurité & auth  
**Public** : Backend developers

---

#### [07-ROADMAP_FONCTIONNALITES.md](./07-ROADMAP_FONCTIONNALITES.md)
**Plan de développement phasé (20 semaines)**
- ✅ Phase 0: Setup (2 sem) — TERMINÉ
- ✅ Phase 1: Foundation (4 sem) — Sprint 1 & 2 TERMINÉS
- ✅ Phase 2: Core Features (6 sem) — Sprint 3-6 TERMINÉS
- ✅ Phase 3: Advanced (4 sem) — Sprint 7-8 TERMINÉS
- ✅ Phase 4: Mobile PWA (4 sem) — Sprint 9-10 TERMINÉS
- ✅ Phase 5: Admin & Analytics — Sprint 11 TERMINÉ
- ✅ Phase 6: Production Hardening — Sprint 12 TERMINÉ
- ✅ Phase 7: UX/UI Polish — Sprint 13 TERMINÉ
- ✅ Phase 8: Categories Enhancement — Sprint 14 TERMINÉ
- ✅ Phase 9: Search & Import Enhancement — Sprint 15 TERMINÉ
- ✅ Phase 10: Admin Field Management — Sprint 16 TERMINÉ
- ✅ Phase 11: UI Overhaul, Platforms & Tako Import Fixes — Sprint 17 TERMINÉ
- ✅ Post-Sprint 17: Adaptation Tako v2.0.1 & Import Multi-Média TERMINÉ

**Usage** : Planification sprint & priorisation  
**Public** : Product Owners, Tech Leads

---

#### [08-DEPLOIEMENT_INFRASTRUCTURE.md](./08-DEPLOIEMENT_INFRASTRUCTURE.md)
**Guide DevOps complet**
- ✅ Docker & Docker Compose (dev)
- ✅ Kubernetes (staging/production)
- ✅ CI/CD GitHub Actions
- ✅ Monitoring (Prometheus, Grafana)
- ✅ Backup & recovery

**Usage** : Déploiement et opérations  
**Public** : DevOps, SRE

---

#### [09-STRATEGIE_TESTS.md](./09-STRATEGIE_TESTS.md)
**Stratégie de tests exhaustive**
- ✅ Tests unitaires (Jest, >80% coverage)
- ✅ Tests intégration (Supertest)
- ✅ Tests E2E (Playwright, Detox)
- ✅ Load testing (k6)
- ✅ Security testing (OWASP ZAP)

**Usage** : Écriture et exécution des tests  
**Public** : QA Engineers, tous les développeurs

---

#### [10-MIGRATION_DONNEES.md](./10-MIGRATION_DONNEES.md)
**Guide de migration v1 → v2**
- ✅ Scripts de migration SQL
- ✅ Mapping des données
- ✅ Stratégie de rollback
- ✅ Tests de migration

**Usage** : Migration production  
**Public** : DBAs, Tech Leads

---

#### [11-GUIDE_DEVELOPPEMENT.md](./11-GUIDE_DEVELOPPEMENT.md)
**Bonnes pratiques de développement**
- ✅ Conventions de code
- ✅ Git workflow
- ✅ Code review guidelines
- ✅ Documentation code

**Usage** : Standards de développement  
**Public** : Tous les développeurs

---

## 🚀 Démarrage Rapide

### Pour les nouveaux développeurs

1. **Comprendre le projet**
   - Lire [01-ANALYSE_PROJET_EXISTANT.md](./01-ANALYSE_PROJET_EXISTANT.md)
   - Lire [02-ARCHITECTURE_GENERALE.md](./02-ARCHITECTURE_GENERALE.md)

2. **Setup environnement**
   - Suivre [03-STACK_TECHNIQUE_DETAILLEE.md](./03-STACK_TECHNIQUE_DETAILLEE.md)
   - Consulter [11-GUIDE_DEVELOPPEMENT.md](./11-GUIDE_DEVELOPPEMENT.md)

3. **Développer**
   - API: [04-API_REST_SPECIFICATION.md](./04-API_REST_SPECIFICATION.md)
   - BDD: [05-BASE_DE_DONNEES_SCHEMA.md](./05-BASE_DE_DONNEES_SCHEMA.md)
   - Sécurité: [06-SECURITE_AUTHENTIFICATION.md](./06-SECURITE_AUTHENTIFICATION.md)

4. **Tester**
   - [09-STRATEGIE_TESTS.md](./09-STRATEGIE_TESTS.md)

### Pour les Product Owners

1. **Vision produit**
   - [07-ROADMAP_FONCTIONNALITES.md](./07-ROADMAP_FONCTIONNALITES.md)
   - [01-ANALYSE_PROJET_EXISTANT.md](./01-ANALYSE_PROJET_EXISTANT.md) (Forces/Faiblesses)

2. **Priorisation**
   - [07-ROADMAP_FONCTIONNALITES.md](./07-ROADMAP_FONCTIONNALITES.md) (Phases & Sprints)

### Pour les DevOps

1. **Infrastructure**
   - [08-DEPLOIEMENT_INFRASTRUCTURE.md](./08-DEPLOIEMENT_INFRASTRUCTURE.md)

2. **Monitoring**
   - [08-DEPLOIEMENT_INFRASTRUCTURE.md](./08-DEPLOIEMENT_INFRASTRUCTURE.md) (Section Monitoring)

3. **Migration**
   - [10-MIGRATION_DONNEES.md](./10-MIGRATION_DONNEES.md)

---

## 📊 Métriques du Projet

### Taille estimée

| Composant | Lignes de code (estimé) |
|-----------|-------------------------|
| Backend (NestJS) | ~15,000 LOC |
| Frontend Web (React + PWA) | ~15,000 LOC |
| Tests | ~10,000 LOC |
| **Total** | **~40,000 LOC** |

### Effort estimé

| Phase | Durée | Équipe |
|-------|-------|--------|
| Setup | 2 semaines | 2 devs |
| Foundation | 4 semaines | 3 devs |
| Core Features | 6 semaines | 4 devs |
| Advanced | 4 semaines | 3 devs |
| Mobile | 4 semaines | 2 devs |
| Production | 2 semaines | 2 devs |
| **Total** | **20 semaines** | **3-4 devs** |

**Charge totale** : ~16 homme-mois

---

## 🔗 Ressources Externes

### Documentation Technologies

- **NestJS** : https://docs.nestjs.com
- **React** : https://react.dev
- **TypeORM** : https://typeorm.io
- **Tailwind CSS** : https://tailwindcss.com
- **Framer Motion** : https://motion.dev
- **Workbox (PWA)** : https://developer.chrome.com/docs/workbox

### Outils

- **Repository** : https://github.com/Nimai26/SnowShelf
- **CI/CD** : https://github.com/Nimai26/SnowShelf/actions
- **Monitoring** : https://grafana.snowshelf.fr
- **Staging** : https://staging.snowshelf.fr
- **Production** : https://snowshelf.fr

---

## 🤝 Contribution

Pour contribuer au projet :

1. Lire [11-GUIDE_DEVELOPPEMENT.md](./11-GUIDE_DEVELOPPEMENT.md)
2. Créer une branche feature/fix
3. Suivre les conventions de code
4. Écrire des tests (coverage >80%)
5. Soumettre une Pull Request

---

## 📞 Contacts

- **Tech Lead** : Nimai
- **Product Owner** : Nimai
- **DevOps** : Nimai

---

## 📝 Changelog de la Documentation

| Date | Version | Changements |
|------|---------|-------------|
| 2026-02-20 | 1.0.0 | Création initiale de la documentation complète |
| 2026-02-21 | 1.1.0 | Sprint 1 terminé (Auth & Users) |
| 2026-02-22 | 1.2.0 | Sprint 2 terminé (UX, thèmes, i18n, design system) |
| 2026-02-22 | 1.3.0 | Sprint 3 terminé (Categories, PrimaryTypes, i18n categories) |
| 2026-02-22 | 1.4.0 | Sprint 4-6 terminés (Items, Media, Statuts, Grades, Emplacements, Search) |
| 2026-02-23 | 1.5.0 | Sprint 7-8 terminés (Tako_Api Integration, Image Editor, Camera) |
| 2026-02-23 | 2.0.0 | Sprint 9-10 terminés (PWA Mobile: manifest, Workbox, push, offline, Web Share, Badging) |
| 2026-02-23 | 2.1.0 | Sprint 11 terminé (Admin Panel: dashboard analytics, gestion utilisateurs, Recharts, broadcast) |
| 2026-02-23 | 2.2.0 | Sprint 12 terminé (Optimization: code splitting, WebP thumbnails, Redis cache, CSP, health check) |
| 2026-02-23 | 2.3.0 | Sprint 13 terminé (UX/UI Polish: animations Framer Motion, skeletons, onboarding, accessibilité WCAG AA) |
| 2026-02-24 | 2.4.0 | Sprint 14-16 terminés (Categ Enhancement, Search & Import Enhancement, Admin Field Management) |
| 2026-02-25 | 2.5.0 | Sprint 17 terminé (UI Overhaul: hero/lightbox/galerie médias, 41 plateformes + admin page, Tako import fixes: getDetail, DETAIL_SEGMENTS, autoTrad FR, normalisation objets, PLATFORM_MAP) |
| 2026-02-26 | 2.6.0 | Adaptation Tako v2.0.1 (champs standardisés: setNumber, pieceCount, minifigCount ; double-unwrap TMDB ; import multi-média: gallery, vidéos, instructions PDF ; pré-remplissage prix marketValue ; pendingMedia système) |
| 2026-02-27 | 2.6.1 | Adaptation Tako v2.0.1 complète tous domaines : DETAIL_SEGMENTS (15 corrections books/music/tcg/boardgames/construction-toys), DOMAIN_PROVIDERS (bgg, pokemon), extractMetadata media (directors, rating, originalLanguage, productionCompanies, numberOfSeasons, createdBy), music (tracks, labels, formats, trackCount), boardgames (players, playTime, stats), TAKO_FIELD_MAPPING mis à jour, segment TMDB dynamique movies/series via param type, DOMAIN_ROUTES uniformisé /api/ pour construction-toys (fix Tako v2.0.1 commit 23e798d) |
| 2026-02-27 | 3.0.0 | Sprint 18 : Liaison catégories ↔ types d'objets — `primaryTypeId` obligatoire + `defaultProviders` JSON sur catégories, sélecteur de type + toggles providers dans CategoryFormPage, contexte catégorie dans TakoSearchModal (domaine + providers pré-sélectionnés), mapping `PRIMARY_TYPE_TO_DOMAINS`, migration données existantes |

---

## ✅ Checklist Utilisation

### Je veux...

- [ ] **Comprendre le projet actuel** → [01-ANALYSE_PROJET_EXISTANT.md](./01-ANALYSE_PROJET_EXISTANT.md)
- [ ] **Voir l'architecture cible** → [02-ARCHITECTURE_GENERALE.md](./02-ARCHITECTURE_GENERALE.md)
- [ ] **Setup mon environnement** → [03-STACK_TECHNIQUE_DETAILLEE.md](./03-STACK_TECHNIQUE_DETAILLEE.md)
- [ ] **Développer une API** → [04-API_REST_SPECIFICATION.md](./04-API_REST_SPECIFICATION.md)
- [ ] **Créer une table BDD** → [05-BASE_DE_DONNEES_SCHEMA.md](./05-BASE_DE_DONNEES_SCHEMA.md)
- [ ] **Implémenter l'auth** → [06-SECURITE_AUTHENTIFICATION.md](./06-SECURITE_AUTHENTIFICATION.md)
- [ ] **Planifier un sprint** → [07-ROADMAP_FONCTIONNALITES.md](./07-ROADMAP_FONCTIONNALITES.md)
- [ ] **Déployer l'app** → [08-DEPLOIEMENT_INFRASTRUCTURE.md](./08-DEPLOIEMENT_INFRASTRUCTURE.md)
- [ ] **Écrire des tests** → [09-STRATEGIE_TESTS.md](./09-STRATEGIE_TESTS.md)
- [ ] **Migrer les données** → [10-MIGRATION_DONNEES.md](./10-MIGRATION_DONNEES.md)
- [ ] **Contribuer au code** → [11-GUIDE_DEVELOPPEMENT.md](./11-GUIDE_DEVELOPPEMENT.md)

---

**Cette documentation constitue la référence complète pour le développement de SnowShelf v2.**
