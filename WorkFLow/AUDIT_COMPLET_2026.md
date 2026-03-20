# AUDIT COMPLET — SnowShelf v2

**Date :** 16 mars 2026
**Mode :** Lecture seule (aucune modification apportée)
**Portée :** Backend, Frontend, Base de données, PWA/Mobile, Docker/Infra

---

## TABLE DES MATIÈRES

1. [Synthèse Globale](#1-synthèse-globale)
2. [Audit Backend (NestJS)](#2-audit-backend-nestjs)
3. [Audit Frontend (React)](#3-audit-frontend-react)
4. [Audit Base de Données (MariaDB)](#4-audit-base-de-données-mariadb)
5. [Audit PWA / Mobile](#5-audit-pwa--mobile)
6. [Audit Docker / Infrastructure](#6-audit-docker--infrastructure)
7. [Classement par Priorité](#7-classement-par-priorité)
8. [Plan d'Action Recommandé](#8-plan-daction-recommandé)

---

## 1. SYNTHÈSE GLOBALE

### Statistiques des problèmes détectés

| Sévérité | Backend | Frontend | BDD | PWA/Mobile | Docker/Infra | **TOTAL** |
|----------|---------|----------|-----|------------|--------------|-----------|
| **CRITIQUE** | 1 | 2 | 2 | 0 | 5 | **10** |
| **HAUTE** | 3 | 5 | 10 | 3 | 4 | **25** |
| **MOYENNE** | 15 | 10 | 11 | 7 | 12 | **55** |
| **BASSE** | 9 | 9 | 7 | 6 | 5+ | **36+** |

### Score de Maturité par Domaine

| Domaine | Score | Commentaire |
|---------|-------|-------------|
| Backend | **7/10** | Solide, guards bien configurés, bcrypt 12 rounds, rate limiting. Problèmes : SSRF proxy, memory leaks, N+1 |
| Frontend | **6.5/10** | UI riche, 44 thèmes, bonne architecture. Problèmes : URL construction cassée en prod, i18n incomplet, accessibilité faible |
| Base de données | **5/10** | Schéma fonctionnel mais fragile. Aucune migration, synchronize:true, colonnes mortes, N+1, init.sql obsolète |
| PWA/Mobile | **7.5/10** | 75-80% prêt mobile. Excellents : manifest, SW, BottomNav, caméra, push, thèmes. Manque : virtual scrolling, IndexedDB, tailles boutons |
| Docker/Infra | **4/10** | Core dumps dans le repo, secrets en clair versionnés, réseau flat, pas de hardening conteneurs |

### Readiness Mobile : **75-80%**
Le projet a une excellente base PWA. Les ajustements restants sont ciblés et bien identifiés.

---

## 2. AUDIT BACKEND (NestJS)

### 2.1 CRITIQUE

#### SSRF dans proxyDownload
**Fichier :** `backend/src/modules/file-serving/file-serving.controller.ts`
Le endpoint `proxyDownload` accepte n'importe quelle URL, y compris des adresses internes (`http://169.254.169.254`, `http://localhost:3306`, etc.). Un attaquant authentifié peut scanner le réseau interne, accéder aux métadonnées cloud, ou atteindre des services non exposés.

**Recommandation :** Valider l'URL avec une allowlist de domaines autorisés (CDN connus, Tako, etc.) et bloquer les IP privées/réservées.

### 2.2 HAUTE

| # | Problème | Détail |
|---|----------|--------|
| 1 | **Memory leaks (setInterval)** | `tako.service.ts` et `image-processing.service.ts` créent des `setInterval` dans `onModuleInit` sans jamais les nettoyer dans `onModuleDestroy`. |
| 2 | **proxyDownload sans limite de taille** | Le fichier entier est chargé en Buffer mémoire. Un fichier de 2 GB crashe le backend. |
| 3 | **N+1 dans resolveWithParentCategories** | Pour chaque catégorie, une requête SQL séparée remonte la hiérarchie parent. |

### 2.3 MOYENNE (15 problèmes)

| # | Problème |
|---|----------|
| 1 | Endpoints admin sans DTO de validation |
| 2 | Swagger exposé en production |
| 3 | Interfaces admin-tako non validées |
| 4 | Limite upload 500 MB excessive |
| 5 | `enableImplicitConversion` dans ValidationPipe |
| 6 | Pas de timeout sur les appels HTTP vers Tako |
| 7 | Logs d'erreur insuffisants (stack traces manquantes) |
| 8 | Pas de circuit breaker pour Tako |
| 9 | Retry infini possible sur les jobs |
| 10 | `TypeORM synchronize:true` en dev (divergence schéma/migrations) |
| 11 | Pas de compression gzip sur les réponses |
| 12 | Headers CORS trop permissifs en dev |
| 13 | Absence de pagination par défaut sur certains endpoints |
| 14 | Pas de cache HTTP (ETag/Last-Modified) sur les fichiers statiques |
| 15 | Pas de healthcheck détaillé (DB + Redis + Tako) |

### 2.4 Points Positifs

- Guards globaux bien configurés (JWT + rôles)
- Bcrypt 12 rounds pour les mots de passe
- Protection contre l'énumération d'emails
- Rate limiting approprié (100 req/min)
- Architecture modulaire propre
- Health endpoint présent
- Gestion des erreurs avec filtres globaux

---

## 3. AUDIT FRONTEND (React)

### 3.1 CRITIQUE

#### Construction d'URL cassée en production
**Fichier :** Multiple (`getMediaUrl`, services, composants)
`const API = import.meta.env.VITE_API_URL` — en mode proxy (production), `VITE_API_URL` est `undefined`. Toutes les URLs d'images deviennent `undefined/storage/users/...`. Le problème est masqué en développement car la variable est définie dans docker-compose.yml.

**3 patterns de construction d'URL inconsistants :**
1. `${import.meta.env.VITE_API_URL}/api/v1/...` — cassé en prod
2. `/api/v1/...` — correct (proxy relatif)
3. `getMediaUrl()` — dupliqué dans 4+ fichiers avec des logiques différentes

**Recommandation :** Centraliser dans un seul helper `getApiUrl()` qui retourne `''` quand `VITE_API_URL` n'est pas défini, et un unique `getMediaUrl()`.

### 3.2 HAUTE (5 problèmes)

| # | Problème | Détail |
|---|----------|--------|
| 1 | **40+ chaînes FR hardcodées** | Non traduites via i18n — "Chargement...", "Aucun résultat", labels de formulaires, etc. |
| 2 | **Accessibilité ARIA sévèrement manquante** | Pas de `role="dialog"`, `aria-modal`, `aria-label` sur les modales, lightbox, menus |
| 3 | **Object URL memory leaks** | `URL.createObjectURL()` dans MediaListManager sans `revokeObjectURL()` au démontage |
| 4 | **push.service.ts routes incorrectes** | Appels sans préfixe `/api/v1` — les notifications push échouent silencieusement en production |
| 5 | **ItemFormPage.tsx : 1759 lignes** | Fichier monolithique impossible à maintenir. Devrait être découpé en sous-composants |

### 3.3 MOYENNE (10 problèmes)

| # | Problème |
|---|----------|
| 1 | `@tanstack/react-query` déclaré comme dépendance mais jamais utilisé |
| 2 | `getMediaUrl` dupliqué dans 4+ fichiers |
| 3 | Couleurs hardcodées dans ImageEditor et CameraCapture (pas CSS vars) |
| 4 | VerifyEmailPage utilise `text-gray-900` au lieu de variables thème |
| 5 | Pas d'AbortController sur les fetches de données |
| 6 | ~37 occurrences de type `any` |
| 7 | `window.confirm` pour confirmation de duplication (non thémé) |
| 8 | Bundle non optimisé (pas de code splitting par route) |
| 9 | Images non lazy-loaded dans les grilles |
| 10 | Pas de gestion d'erreur globale (Error Boundary) |

### 3.4 Points Positifs

- Architecture composants bien structurée
- 44 thèmes avec système CSS variables complet
- Animations Framer Motion fluides
- Transitions de pages
- Système de notifications toast
- Forms avec validation
- Service worker avec stratégies de cache multiples

---

## 4. AUDIT BASE DE DONNÉES (MariaDB)

### 4.1 CRITIQUE

#### Aucune migration existante
**Dossiers :** `database/migrations/` et `backend/src/database/migrations/` — tous les deux **VIDES**.
Le schéma est géré **uniquement** par `TypeORM synchronize:true`. Cela signifie :
- Aucune traçabilité des changements de schéma
- Impossible de reproduire un environnement identique
- Risque de perte de données lors des mises à jour d'entités
- Rollback impossible après un changement destructif

#### N+1 dans resolveParentChain
La fonction `resolveParentChain()` exécute 1 requête SQL par niveau de hiérarchie dans une boucle while. Pour une catégorie à 5 niveaux de profondeur, c'est 5 requêtes au lieu d'une seule récursive.

### 4.2 HAUTE (10 problèmes)

| # | Problème | Détail |
|---|----------|--------|
| 1 | **`users.total_value` jamais mis à jour** | Colonne morte — toujours à 0 |
| 2 | **`storage_locations.items_count` jamais mis à jour** | Compteur dénormalisé désynchronisé |
| 3 | **`items_count` / `categories_count` dénormalisés** | Risque de désynchronisation permanent |
| 4 | **`synchronize: true` en dev** | Le schéma réel peut diverger des entités sans que personne ne le sache |
| 5 | **`init.sql` massivement obsolète** | Des dizaines de tables manquantes ou en trop par rapport au schéma réel |
| 6 | **`dev-seeds.sql` avec mots de passe connus** | Admin1234! et schéma incompatible avec le schéma actuel |
| 7 | **findAll categories N+1 pour hiérarchie** | Chaque catégorie charge ses parents un par un |
| 8 | **`propagateParentChangeToItems` N+1** | Charge et met à jour chaque item individuellement |
| 9 | **Pas de transaction sur les opérations bulk** | Les opérations multi-items ne sont pas atomiques |
| 10 | **Pas de soft delete** | Les suppressions sont définitives, aucune récupération possible |

### 4.3 MOYENNE (11 problèmes)

| # | Problème |
|---|----------|
| 1 | 4 index dupliqués sur users/domains/primary_types |
| 2 | `grades.name` manque UNIQUE(user_id, name) |
| 3 | `statuses.name` manque UNIQUE(user_id, name) |
| 4 | `storage_locations.name` manque UNIQUE(user_id, name) |
| 5 | FK `category_grades` sans CASCADE |
| 6 | `notifications` manque index composites (user_id, read, created_at) |
| 7 | `value_json` sans validation structurelle |
| 8 | findAll items charge toutes les images |
| 9 | Pas de partitionnement pour les grandes tables |
| 10 | Pas de monitoring des slow queries |
| 11 | Pas de contrainte CHECK sur les colonnes de type enum stockées en VARCHAR |

### 4.4 Points Positifs

- Schéma EAV bien conçu pour la flexibilité des catégories
- Relations bien définies entre entités
- Indexes présents sur les clés étrangères principales
- Types de données appropriés (BIGINT pour les IDs, TEXT pour JSON)

---

## 5. AUDIT PWA / MOBILE

### Score Global : **75-80% Mobile Ready**

### 5.1 Points Forts (excellents)

| Domaine | Score | Détail |
|---------|-------|--------|
| **PWA Manifest** | 10/10 | Icons 192/512, display standalone, theme_color, start_url, categories |
| **Service Worker** | 9/10 | Workbox avec 4 stratégies (CacheFirst images, StaleWhileRevalidate API, NetworkFirst), précache manifest |
| **BottomNav** | 10/10 | Safe-area, animations, badge notifications, responsive |
| **Caméra** | 9/10 | Capture, recadrage, rotation, compression JPEG, gestion permissions |
| **Push Notifications** | 9/10 | VAPID, souscription serveur, permission prompt avec design |
| **Pull-to-Refresh** | 8/10 | Indicateur animé, threshold configurable |
| **Web Share API** | 8/10 | Partage natif avec fallback clipboard |
| **Thèmes** | 10/10 | 44 thèmes via CSS variables, transitions fluides |
| **Install Prompt** | 9/10 | Prompt personnalisé avec cooldown 7 jours |
| **Animations** | 8/10 | Framer Motion, prefers-reduced-motion supporté |

### 5.2 HAUTE (3 problèmes)

| # | Problème | Impact Mobile | Recommandation |
|---|----------|---------------|----------------|
| 1 | **Pas de virtual scrolling** | Collections de 1000+ items → lag/crash sur mobile | Implémenter `react-virtuoso` ou `@tanstack/virtual` |
| 2 | **Pas d'IndexedDB offline** | Aucune donnée disponible hors-ligne | Implémenter un cache IndexedDB avec synchronisation |
| 3 | **Boutons trop petits** | `md` (40px) < WCAG minimum 44px | Augmenter `md` à 44px ou utiliser `lg` par défaut |

### 5.3 MOYENNE (7 problèmes)

| # | Problème |
|---|----------|
| 1 | Safe areas incomplètes — seul BottomNav gère le bottom |
| 2 | Pas de CSS touch globals (`-webkit-tap-highlight-color`, `overscroll-behavior`) |
| 3 | PWAUpdatePrompt possiblement incompatible avec `autoUpdate` |
| 4 | Images BGG non couvertes par le cache regex du SW |
| 5 | TakoSearchModal non fully responsive |
| 6 | Pas de Background Sync |
| 7 | Position Toaster en conflit avec BottomNav sur mobile |

### 5.4 BASSE (6 problèmes)

| # | Problème |
|---|----------|
| 1 | Pas de Skeleton screens pour le chargement |
| 2 | Pas de gestes de navigation (swipe back) |
| 3 | Pas de support orientation landscape dédié |
| 4 | Pas de badge d'app natif (navigator.setAppBadge) |
| 5 | Pas de Periodic Background Sync |
| 6 | Pas de compression d'image avant upload (côté client) |

---

## 6. AUDIT DOCKER / INFRASTRUCTURE

### 6.1 CRITIQUE (5 problèmes)

| # | Problème | Détail |
|---|----------|--------|
| 1 | **Core dumps dans le repo** | `backend/core.433` (119 MB) et `core.444` (85 MB) — peuvent contenir des secrets en mémoire (JWT, passwords). Non dans `.gitignore`. |
| 2 | **Secrets hardcodés dans docker-compose.yml** | Tous les mots de passe, JWT secret, admin credentials en clair dans un fichier versionné |
| 3 | **Clé VAPID privée en clair** | Dans docker-compose.yml — permet à un attaquant d'envoyer des push notifications en se faisant passer pour SnowShelf |
| 4 | **Fallbacks de mots de passe faibles en prod** | `${DB_PASSWORD:-snowshelf_pass}` — si .env absent, l'app démarre avec des credentials triviaux |
| 5 | **Admin credentials hardcodés** | `admin@snowshelf.fr / Admin1234!` directement dans le compose |

### 6.2 HAUTE (4 problèmes)

| # | Problème |
|---|----------|
| 1 | Mots de passe visibles dans le Makefile (`ps aux`) |
| 2 | Fallback de mots de passe dans les scripts backup/restore |
| 3 | Pas de backup automatisé en production |
| 4 | SECURITY.md ne couvre pas les vrais problèmes Docker |

### 6.3 MOYENNE (12 problèmes)

| # | Problème |
|---|----------|
| 1 | Réseau flat — pas d'isolation frontend/DB |
| 2 | Ports DB/Redis bindés sur 0.0.0.0 en dev |
| 3 | Pas de `cap_drop`, `security_opt`, `read_only` en prod |
| 4 | Pas de limites de ressources (CPU/mémoire) |
| 5 | Pas de logging driver configuré |
| 6 | Tags `:latest` partout (non reproductible) |
| 7 | Backups non chiffrés |
| 8 | Manque CSP et HSTS dans nginx |
| 9 | Dev seeds livrés en production |
| 10 | Conteneurs dev en root |
| 11 | Node 20 LTS en fin de vie imminente (avril 2026) |
| 12 | `clean-all` supprime TOUT Docker du système |

### 6.4 Points Positifs

| Élément | Détail |
|---------|--------|
| **Dockerfiles prod** | Multi-stage, utilisateur non-root, dumb-init, health checks |
| **Health checks complets** | Tous les services prod avec start_period |
| **Restart policies** | `unless-stopped` partout |
| **Volumes nommés** | Persistence correcte |
| **Rotation backups** | MAX_BACKUPS=10 avec nettoyage auto |
| **`.env` dans .gitignore** | Correct |

---

## 7. CLASSEMENT PAR PRIORITÉ

### URGENCE IMMÉDIATE (à faire ce sprint)

| # | Action | Domaine | Effort |
|---|--------|---------|--------|
| 1 | **Supprimer core dumps** (`core.433`, `core.444`) + `.gitignore` | Docker | 5 min |
| 2 | **Externaliser secrets** vers `env_file: .env` | Docker | 1h |
| 3 | **Fixer construction URLs frontend** (centraliser `getApiUrl`) | Frontend | 2h |
| 4 | **Corriger push.service.ts** (ajouter `/api/v1` prefix) | Frontend | 15 min |
| 5 | **Fixer SSRF** dans proxyDownload (allowlist de domaines) | Backend | 1h |

### HAUTE PRIORITÉ (à planifier rapidement)

| # | Action | Domaine | Effort |
|---|--------|---------|--------|
| 6 | Créer les premières migrations TypeORM | BDD | 4h |
| 7 | Fixer memory leaks (setInterval + URL.createObjectURL) | Backend+Frontend | 2h |
| 8 | Ajouter limite de taille dans proxyDownload | Backend | 30 min |
| 9 | Résoudre N+1 resolveParentChain (CTE récursive) | BDD | 3h |
| 10 | Séparer réseau Docker (frontend_net / backend_net) | Docker | 1h |
| 11 | Supprimer dev-seeds du compose prod | Docker | 5 min |
| 12 | Internationaliser les 40+ strings FR hardcodées | Frontend | 4h |

### PRIORITÉ MOYENNE (sprints suivants)

| # | Action | Domaine |
|---|--------|---------|
| 13 | Implémenter virtual scrolling pour les grandes collections | Frontend/Mobile |
| 14 | Ajouter accessibilité ARIA aux modales et dialogs | Frontend |
| 15 | Centraliser getMediaUrl en un seul helper | Frontend |
| 16 | Découper ItemFormPage.tsx (1759 lignes) | Frontend |
| 17 | Ajouter UNIQUE(user_id, name) sur grades/statuses/storage_locations | BDD |
| 18 | Nettoyer init.sql / dev-seeds.sql | BDD |
| 19 | Supprimer colonnes mortes (total_value, items_count) | BDD |
| 20 | Ajouter hardening conteneurs prod (cap_drop, limits, logging) | Docker |
| 21 | Augmenter taille boutons à 44px minimum (WCAG) | Mobile |
| 22 | Ajouter IndexedDB pour mode offline | Mobile |
| 23 | Configurer CSP et HSTS dans nginx | Docker |
| 24 | Migrer vers Node 22 LTS | Docker |

---

## 8. PLAN D'ACTION RECOMMANDÉ

### Phase 1 : Sécurité Critique (Sprint immédiat)
- [ ] Supprimer core dumps et ajouter à .gitignore
- [ ] Externaliser tous les secrets (env_file, supprimer fallbacks prod)
- [ ] Régénérer clé VAPID (considérée compromise)
- [ ] Fixer SSRF dans proxyDownload
- [ ] Corriger construction URLs frontend

### Phase 2 : Stabilité (Sprint suivant)
- [ ] Créer premières migrations TypeORM
- [ ] Fixer memory leaks
- [ ] Corriger push.service.ts
- [ ] Résoudre N+1 queries
- [ ] Séparer réseaux Docker

### Phase 3 : Qualité (2-3 sprints)
- [ ] Centraliser helpers URL
- [ ] Compléter i18n
- [ ] Améliorer accessibilité
- [ ] Virtual scrolling
- [ ] Hardening conteneurs

### Phase 4 : Mobile Ready 95%+ (3-4 sprints)
- [ ] IndexedDB offline
- [ ] Background Sync
- [ ] Skeleton screens
- [ ] Augmenter tailles tactiles
- [ ] Safe areas complètes

---

*Audit généré le 16 mars 2026 — SnowShelf v2*
