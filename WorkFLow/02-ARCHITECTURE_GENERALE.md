# 🏗️ ARCHITECTURE GÉNÉRALE - SnowShelf v2

> **Document de référence** - Architecture complète du nouveau système
> 
> **Date de création** : 20 février 2026
> **Status** : ✅ Validé

---

## 🎯 Vision Architecturale

### Objectifs
1. **Application web moderne** : Progressive Web App (PWA) installable avec performance optimale
2. **API REST unifiée** : Backend servant web et mobile (PWA)
3. **Scalabilité** : Architecture permettant la croissance
4. **Maintenabilité** : Code structuré, testé, documenté

### Principes Directeurs
- ✅ **Séparation des responsabilités** : Backend API, Frontend Web (PWA) indépendants
- ✅ **API-First** : Backend expose uniquement des APIs (pas de templating)
- ✅ **Mobile-First** : Design et UX pensés pour mobile d'abord
- ✅ **Progressive Enhancement** : Fonctionnalités additionnelles si disponibles
- ✅ **Offline-First** : Données accessibles hors connexion (cache intelligent)
- ✅ **Sécurité par défaut** : Authentification, validation, encryption

---

## 📐 Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐     │
│  │           Web Browser (PWA installable)            │     │
│  │      Desktop / Mobile (Android + iOS)             │     │
│  └──────────────────────┬───────────────────────────┘     │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                     API GATEWAY                               │
│                  (Load Balancer + SSL)                        │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                      BACKEND LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    API REST                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │   │
│  │  │   Auth   │ │  Users   │ │  Items   │ │ Media  │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           BUSINESS LOGIC LAYER                       │   │
│  │  - Services (UserService, ItemService, etc.)        │   │
│  │  - Validators                                        │   │
│  │  - Transformers                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           DATA ACCESS LAYER (ORM)                    │   │
│  │  - Repositories                                      │   │
│  │  - Models                                            │   │
│  │  - Migrations                                        │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                   INFRASTRUCTURE                              │
├──────────────────────────┴───────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐              │
│  │ Database │  │  Redis   │  │  Filesystem  │              │
│  │ (MariaDB)│  │  (Cache) │  │  (storage/)  │              │
│  └──────────┘  └──────────┘  └──────────────┘              │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  SMTP    │  │  Logs    │  │ Metrics  │  │  Backup  │    │
│  │ (Email)  │  │(Loki/ELK)│  │(Grafana) │  │ (Auto)   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└───────────────────────────────────────────────────────────────┘
```

---

## 🎨 Architecture Frontend Web (PWA)

### Structure
```
frontend/
├── public/                    # Assets statiques
│   ├── robots.txt             # SEO robots
│   └── images/                # Icônes PWA générées
├── src/
│   ├── assets/                # Images, styles globaux
│   │   ├── images/
│   │   └── styles/            # index.css (Tailwind + variables CSS)
│   ├── components/            # Composants réutilisables
│   │   ├── common/            # ErrorBoundary, OnboardingTutorial
│   │   ├── layout/            # Layout, TopBar, BottomNav, Sidebar
│   │   ├── media/             # ImageEditor, CameraCapture, MediaListManager
│   │   └── ui/                # Button, Modal, Input, Spinner, EmptyState, etc.
│   ├── hooks/                 # Custom React hooks
│   │   ├── useOnlineStatus.ts
│   │   ├── usePullToRefresh.ts
│   │   ├── usePushNotifications.ts
│   │   ├── usePWAInstall.ts
│   │   └── useWebShare.ts
│   ├── i18n/                  # Traductions (i18next)
│   │   ├── config.ts
│   │   └── locales/           # fr/, en/ (7 namespaces)
│   ├── lib/                   # Utilitaires (cn, etc.)
│   ├── pages/                 # Pages par fonctionnalité
│   │   ├── admin/             # Dashboard, Users admin
│   │   ├── auth/              # Login, Register
│   │   ├── categories/        # Categories CRUD
│   │   ├── home/              # HomePage (landing + dashboard)
│   │   ├── items/             # Items CRUD + détail
│   │   └── manage/            # Statuts, grades, emplacements, types
│   ├── services/              # API calls (Axios)
│   ├── stores/                # State management (Zustand)
│   ├── theme/                 # Système de thèmes
│   ├── types/                 # Types TypeScript
│   ├── utils/                 # Utilitaires
│   ├── App.tsx                # Routes + providers
│   └── main.tsx               # Bootstrap
├── package.json
├── vite.config.ts             # Config Vite + PWA
├── tailwind.config.js         # Config Tailwind
├── postcss.config.js
└── tsconfig.json
```

### Technologies Utilisées
- **Framework** : React 18.2 avec TypeScript
- **Build Tool** : Vite 5.x (HMR rapide, optimisations modernes)
- **State Management** : Zustand 4.x (léger, simple)
- **Routing** : React Router v6
- **UI Components** : Design system custom (Button, Modal, Input, Select, etc.)
- **Styling** : Tailwind CSS 3.4 + CSS Variables (thèmes dark/light)
- **Forms** : Formulaires natifs React (controlled components)
- **Data Fetching** : TanStack Query (React Query) 5.x
- **PWA** : vite-plugin-pwa + Workbox
- **Icons** : Lucide React
- **Animations** : Framer Motion 12.x + keyframes Tailwind
- **Notifications** : react-hot-toast
- **Charts** : Recharts 3.x (admin dashboard)
- **i18n** : i18next + react-i18next (fr/en)
- **Utilities** : class-variance-authority, tailwind-merge

### Service Worker (PWA — via vite-plugin-pwa + Workbox)
```typescript
// Stratégies de cache configurées dans vite.config.ts (generateSW)
const runtimeCaching = [
  // API calls → NetworkFirst (timeout 10s, max 200 entries, 24h)
  { urlPattern: /\/api\/v1\//, handler: 'NetworkFirst' },
  
  // User media → CacheFirst (max 500 entries, 30 jours)
  { urlPattern: /\/storage\/users\//, handler: 'CacheFirst' },
  
  // External images (Google Books, RAWG, OpenLibrary) → StaleWhileRevalidate (7 jours)
  { urlPattern: /books\.google|media\.rawg|covers\.openlibrary/, handler: 'StaleWhileRevalidate' },
  
  // Google Fonts → CacheFirst (1 an)
  { urlPattern: /fonts\.googleapis|fonts\.gstatic/, handler: 'CacheFirst' }
];

// Precache: shell applicatif (HTML, CSS, JS, images, fonts)
// Offline: navigateFallback → index.html (SPA routing)
// Updates: skipWaiting + clientsClaim (mise à jour immédiate)
```

---

## 📱 Architecture Mobile — Stratégie PWA

### Approche Retenue
**PWA (Progressive Web App)** comme unique cible mobile.

L'application React/Vite existante est déjà responsive et mobile-first. L'ajout de :
- Service Worker (Workbox via vite-plugin-pwa)
- Web App Manifest
- APIs web natives (Camera, Web Share, Vibration, Push, Badging)

...transforme l'app web en une **expérience mobile comparable à une app native** :
- Installable sur l'écran d'accueil (Android + iOS)
- Fonctionne hors-ligne (cache shell + sync en arrière-plan)
- Notifications push (VAPID + Web Push API)
- Accès caméra, flash, zoom, code-barres
- Édition d'images tactile (pinch-to-zoom, drag, crop)

### Composants Mobile-Critical (Canvas natif, 0 dépendance)
- **ImageEditor** (~1400 lignes) : crop 8 poignées, rotate, flip, zoom, filtres, export — touch events complets
- **CameraCapture** (~1300 lignes) : getUserMedia, switch front/back, flash/torch, zoom pinch, mode scan barcode
- **BarcodeScanner** (~465 lignes) : BarcodeDetector API + fallback QuaggaJS, 8 formats, confirmation double
- **DocumentViewer** (~1400 lignes) : PDF/EPUB/CBZ/ZIP, chargement dynamique libs
- **MediaListManager** : upload multi-sources (fichier, camera, blob, proxy), flux 2 étapes, lecteur audio

> **Note** : La stratégie PWA couvre 100% des besoins identifiés. Aucune app native (React Native/Flutter) n'est prévue.

---

## 🔧 Architecture Backend

### Structure
```
backend/
├── src/
│   ├── main.ts                # Point d'entrée
│   ├── app.module.ts          # Module racine
│   ├── app.controller.ts      # Health check
│   ├── app.service.ts
│   ├── config/                # Configuration
│   │   └── typeorm.config.ts
│   ├── common/                # Code partagé
│   │   ├── decorators/        # @Roles, @Public, @CurrentUser
│   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   ├── filters/           # GlobalExceptionFilter
│   │   ├── interceptors/      # PerformanceInterceptor
│   │   ├── pipes/             # Validation pipes
│   │   └── dto/               # PaginationDto, etc.
│   ├── modules/               # Modules métier (17 modules)
│   │   ├── auth/              # JWT access + refresh tokens
│   │   ├── users/             # CRUD + profil
│   │   ├── categories/        # CRUD catégories
│   │   ├── items/             # CRUD items + métadonnées
│   │   ├── item-media/        # Upload/gestion médias items
│   │   ├── category-media/    # Upload/gestion médias catégories
│   │   ├── file-serving/      # Serveur fichiers statiques
│   │   ├── statuses/          # CRUD statuts
│   │   ├── grades/            # CRUD grades
│   │   ├── storage-locations/ # CRUD emplacements
│   │   ├── primary-types/     # Types primaires (Book, VideoGame, etc.)
│   │   ├── search/            # Web search (Tako_Api)
│   │   ├── tako/              # Proxy Tako API
│   │   ├── notifications/     # Web Push (VAPID)
│   │   ├── mail/              # Nodemailer
│   │   ├── image-processing/  # Sharp (WebP, thumbnails)
│   │   └── admin/             # Dashboard, gestion users
│   └── database/
│       ├── entities/          # TypeORM entities
│       ├── migrations/
│       └── seeds/
├── storage/                   # Fichiers utilisateurs
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Technologies Utilisées
- **Framework** : NestJS 10.3 (structure solide, DI, modularité)
- **Language** : TypeScript 5.3
- **ORM** : TypeORM 0.3.19 (MariaDB via mysql2)
- **Validation** : class-validator + class-transformer
- **Auth** : Passport (JWT access 4h + Refresh Token 7j)
- **Cache** : cache-manager 7.x + cache-manager-redis-store + ioredis
- **Sécurité** : Helmet (CSP), @nestjs/throttler (rate limiting), compression
- **File Upload** : Multer + Sharp 0.34 (WebP, thumbnails)
- **Email** : Nodemailer (via MailHog en dev)
- **Push Notifications** : web-push (VAPID, Web Push Protocol)
- **Configuration** : @nestjs/config (variables env)
- **Password** : bcryptjs (cost 12)
- **Tests** : Jest + Supertest

### Alternative : Laravel (PHP)
Si vous préférez rester en PHP :
- **Framework** : Laravel 11
- **ORM** : Eloquent
- **Cache** : Redis
- **Queue** : Laravel Queue + Redis
- **Tests** : PHPUnit + Pest

**Avantages NestJS** :
- Architecture moderne (inspirée Angular)
- TypeScript (typage fort)
- Performance Node.js
- Excellent pour APIs REST

**Avantages Laravel** :
- Continuité avec PHP actuel
- Artisan CLI puissant
- Ecosystem mature (Forge, Vapor, Nova)
- Plus facile migration depuis code PHP existant

---

## 🗄️ Architecture Base de Données

### Stratégie Migration
1. **Conserver MariaDB** : Base principale (relationnel)
2. **Ajouter Redis** : Cache + sessions
3. **Fichiers** : Système de fichiers local (storage/)

### Optimisations Prévues
- **Indexation** : Tous les champs de recherche/tri
- **Partitionnement** : Tables volumineuses (items, media)
- **Réplication** : Read replicas pour scaling lecture
- **Backup automatique** : Quotidien + archivage

### Schéma Relationnel
```sql
-- Optimisations par rapport au schéma actuel

-- Index composites pour performances
CREATE INDEX idx_items_user_date ON items(user_id, created_at DESC);
CREATE INDEX idx_items_search ON items(user_id, name, description);
CREATE INDEX idx_metadata_lookup ON item_metadata(item_id, field_id);

-- Colonnes calculées pour statistiques
ALTER TABLE users ADD COLUMN items_count INT DEFAULT 0;
ALTER TABLE categories ADD COLUMN items_count INT DEFAULT 0;

-- Soft deletes
ALTER TABLE items ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE categories ADD COLUMN deleted_at TIMESTAMP NULL;

-- Timestamps optimisés
ALTER TABLE items ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

---

## 🔄 Flux de Données

### Création d'un Item (Exemple)

```
┌─────────────┐
│   Mobile    │
│   Client    │
└──────┬──────┘
       │ 1. POST /api/items
       │    + multipart/form-data
       ▼
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │ 2. Validate JWT
       │    Check permissions
       ▼
┌─────────────┐
│   Backend   │
│ (Controller)│
└──────┬──────┘
       │ 3. Validate DTO
       │    (class-validator)
       ▼
┌─────────────┐
│   Service   │
│  (Business) │
└──────┬──────┘
       │ 4. Process images (Sharp)
       │    Save to filesystem (storage/)
       │    Generate WebP thumbnails
       ▼
┌─────────────┐
│ Repository  │
│   (ORM)     │
└──────┬──────┘
       │ 5. BEGIN TRANSACTION
       │    INSERT into items
       │    INSERT into item_metadata
       │    INSERT into item_images
       │    COMMIT
       ▼
┌─────────────┐
│  Database   │
│  (MariaDB)  │
└──────┬──────┘
       │ 6. Invalidate cache
       │    Update counters
       ▼
┌─────────────┐
│    Redis    │
│   (Cache)   │
└──────┬──────┘
       │ 7. Return item
       │    + generated URLs
       ▼
┌─────────────┐
│   Client    │
│   (Update)  │
└─────────────┘
```

### Recherche avec Cache

```
Client → API → Check Redis
                  │
        ┌─────────┴──────────┐
        │ Cache Hit          │ Cache Miss
        ▼                    ▼
    Return cached        Query Database
    result               │
                         ├─ Apply filters
                         ├─ Paginate
                         ├─ Transform
                         │
                         ├─ Store in Redis (TTL: 5min)
                         │
                         └─ Return result
```

---

## 🔐 Architecture Sécurité

### Authentification (JWT)

```
┌─────────────────────────────────────────────────────────┐
│                    JWT Token Flow                        │
└─────────────────────────────────────────────────────────┘

LOGIN
Client → POST /auth/login (email, password)
         ↓
Backend  ├─ Verify credentials (bcrypt)
         ├─ Generate Access Token (15min)
         ├─ Generate Refresh Token (7 days)
         └─ Store Refresh Token in DB
         ↓
Client   ← Return {accessToken, refreshToken, user}
         ├─ Store accessToken in memory (React state)
         └─ Store refreshToken in httpOnly cookie (web)
             OR secure storage (mobile)

API CALL
Client → GET /api/items
         Header: Authorization: Bearer {accessToken}
         ↓
Backend  ├─ Validate JWT signature
         ├─ Check expiration
         ├─ Extract user_id
         └─ Authorize resource
         ↓
Client   ← Return data

TOKEN REFRESH
Client → POST /auth/refresh
         Cookie: refreshToken (web)
         OR Body: {refreshToken} (mobile)
         ↓
Backend  ├─ Validate refresh token
         ├─ Check DB (not revoked)
         ├─ Generate new Access Token
         └─ Optionally rotate Refresh Token
         ↓
Client   ← Return {accessToken}
```

### Niveaux de Permission

| Endpoint | Free | Premium | Admin |
|----------|------|---------|-------|
| GET /categories (default) | ✅ | ✅ | ✅ |
| GET /categories (public) | ❌ | ✅ | ✅ |
| GET /categories (own) | ❌ | ✅ | ✅ |
| POST /categories | ❌ | ✅ | ✅ |
| POST /categories (isDefault) | ❌ | ❌ | ✅ |
| PUT /categories/:id (own) | ❌ | ✅ | ✅ |
| PUT /categories/:id (default) | ❌ | ❌ | ✅ |
| DELETE /categories/:id | ❌ | ✅ (own) | ✅ |
| POST /categories/:id/copy | ❌ | ✅ | ✅ |
| PUT /categories/:id/grades | ❌ | ✅ (own) | ✅ |
| GET /categories/:id/items | ✅ | ✅ | ✅ |
| GET /items | ✅ (limited) | ✅ | ✅ |
| POST /items | ❌ | ✅ | ✅ |
| PUT /items/:id | ❌ | ✅ (own) | ✅ |
| DELETE /items/:id | ❌ | ✅ (own) | ✅ |
| GET /admin/* | ❌ | ❌ | ✅ |

---

## 📊 Architecture Monitoring

### Stack de Monitoring
```
┌─────────────────────────────────────────────────────────┐
│                  MONITORING STACK                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   Logs   │  │ Metrics  │  │  Traces  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │              │                    │
│       ▼             ▼              ▼                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   Loki   │  │Prometheus│  │  Jaeger  │             │
│  │   (ELK)  │  │          │  │          │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │              │                    │
│       └─────────────┼──────────────┘                    │
│                     ▼                                   │
│              ┌──────────┐                               │
│              │ Grafana  │                               │
│              │Dashboard │                               │
│              └──────────┘                               │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │          ALERTING                         │          │
│  │  - Alertmanager (Prometheus)             │          │
│  │  - Email / Slack / PagerDuty             │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### Métriques Clés
- **Backend** : Requêtes/s, latence P95/P99, taux erreur
- **Database** : Connexions, requêtes lentes, deadlocks
- **Cache** : Hit rate, evictions
- **Storage** : Espace disque, I/O
- **Application** : Utilisateurs actifs, items créés/jour

---

## 🚀 Architecture Déploiement

### Environnements

```
┌───────────────────────────────────────────────────────┐
│             DEVELOPMENT (Local)                        │
├───────────────────────────────────────────────────────┤
│  Docker Compose (9 services) :                         │
│  - snowshelf_backend (NestJS, port 4000)               │
│  - snowshelf_frontend (Vite, port 5173)                │
│  - snowshelf_mariadb (MariaDB 10.11, port 3308)        │
│  - snowshelf_redis (Redis 7, port 6380)                │
│  - snowshelf_tako_api (Tako, port 3002)                 │
│  - snowshelf_tako_postgres (PostgreSQL, port 5433)      │
│  - snowshelf_flaresolverr (port 8192)                   │
│  - snowshelf_phpmyadmin (port 8081)                     │
│  - snowshelf_mailhog (port 8025)                        │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│             PRODUCTION                                 │
├───────────────────────────────────────────────────────┤
│  Docker Compose (production) :                         │
│  - Backend (NestJS)                                    │
│  - Frontend (Nginx / static build)                     │
│  - Database (MariaDB)                                  │
│  - Redis                                               │
│  - NGINX Proxy Manager (reverse proxy + SSL)           │
│  - Backup automatique quotidien                        │
└───────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml (exemple)

stages:
  - test
  - build
  - deploy

test:
  - Lint (ESLint)
  - Unit tests (Jest)
  - Integration tests

build:
  - Build frontend (Vite)
  - Build backend (NestJS)
  - Build Docker images

deploy-production:
  - Manuel avec validation
  - docker compose up -d
  - Healthchecks
```

---

## 🎨 Architecture Système de Thèmes

### Système v2 (Amélioration)

```typescript
// theme.config.ts
export interface Theme {
  id: string;
  name: string;
  category: 'dark' | 'light';
  colors: {
    // Couleurs sémantiques
    primary: string;
    secondary: string;
    accent: string;
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    // États
    success: string;
    warning: string;
    error: string;
    info: string;
    // UI
    border: string;
    shadow: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

// Génération CSS Variables dynamique
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        root.style.setProperty(`--color-${key}-${subKey}`, subValue);
      });
    } else {
      root.style.setProperty(`--color-${key}`, value);
    }
  });
}
```

### Support Dark/Light Mode
```typescript
// Auto-détection préférence système + override utilisateur
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const userPreference = localStorage.getItem('theme-mode'); // 'dark' | 'light' | 'auto'

function getEffectiveTheme() {
  if (userPreference === 'auto' || !userPreference) {
    return prefersDark.matches ? 'dark' : 'light';
  }
  return userPreference;
}
```

---

## 🌐 Architecture i18n

### Système Amélioré

```typescript
// i18n.config.ts
export const supportedLocales = ['fr', 'en', 'es', 'de', 'ja'] as const;
export type Locale = typeof supportedLocales[number];

// Structure des traductions
export interface I18nMessages {
  common: {
    save: string;
    cancel: string;
    delete: string;
    // ...
  };
  auth: {
    login: string;
    register: string;
    // ...
  };
  // ... autres namespaces
}

// Lazy loading des traductions
export async function loadLocale(locale: Locale) {
  return await import(`./locales/${locale}.json`);
}
```

### Détection Locale
1. **URL** : `/fr/collections` → `fr`
2. **User Preference** : BDD `users.lang_pref`
3. **Browser** : `navigator.language`
4. **Default** : `fr`

---

## 📈 Scalabilité

### Stratégies de Scaling

#### Horizontal Scaling (Recommandé)
```
Load Balancer
     │
     ├─── Backend Instance 1 ──┐
     ├─── Backend Instance 2 ──┼─── Redis (sessions partagées)
     └─── Backend Instance N ──┘
                │
                └─── Database Cluster (read replicas)
```

#### Performance Optimizations
- **CDN** : CloudFlare pour assets statiques
- **Image Optimization** : Sharp + WebP + AVIF
- **Lazy Loading** : Images, routes, components
- **Code Splitting** : Bundles par route
- **Compression** : Gzip/Brotli
- **HTTP/2** : Multiplexing
- **Service Worker** : Cache intelligent

#### Caching Strategy
```
┌────────────────────────────────────────┐
│        CACHE LAYERS                    │
├────────────────────────────────────────┤
│  1. Browser Cache (PWA/SW)             │
│     → Assets statiques, données offline│
│                                         │
│  2. CDN Cache                           │
│     → Images, JS, CSS                   │
│                                         │
│  3. Redis Cache (Backend)               │
│     → Requêtes API fréquentes           │
│     → Sessions utilisateurs             │
│                                         │
│  4. Database Query Cache                │
│     → Résultats requêtes lourdes        │
└────────────────────────────────────────┘
```

---

## 🔄 Migration du Projet Existant

### Plan de Migration

#### Phase 1 : Infrastructure (2 semaines) ✅
- Setup nouveau backend (NestJS)
- Setup frontend web (React + Vite)
- Configuration Docker Compose

#### Phase 2 : Migration API Core (3 semaines) ✅
- Auth (JWT access + refresh)
- Users CRUD
- Categories CRUD
- Items CRUD + médias

#### Phase 3 : Migration Fonctionnalités (4 semaines) ✅
- Métadonnées dynamiques (EAV)
- Upload médias (filesystem + Sharp)
- Système de thèmes v2
- i18n (i18next, fr/en)
- Recherche & filtres

#### Phase 4 : Fonctionnalités Avancées (3 semaines) ✅
- Web Search (Tako_Api : 32 providers, 11 domaines)
- ImageEditor, CameraCapture, BarcodeScanner
- Admin panel (dashboard + gestion users)

#### Phase 5 : PWA Mobile (4 semaines) ✅
- Service Worker (Workbox)
- Web Push Notifications (VAPID)
- Install prompt (A2HS)
- Offline mode + cache strategies
- Web Share API

#### Phase 6 : Production Hardening (2 semaines) ✅
- Performance (code splitting, WebP, Redis cache)
- Sécurité (Helmet CSP, rate limiting, compression)
- Health check, monitoring
- Backup automatique

#### Phase 7 : UX/UI Polish ✅
- Animations (Framer Motion)
- Skeletons, empty/error states
- Onboarding tutorial
- Accessibilité WCAG AA

---

## 📋 Checklist Architecture

### Backend
- [x] Framework NestJS 10.3
- [x] ORM TypeORM 0.3.19
- [x] Auth JWT (access 4h + refresh 7j)
- [x] Validation (class-validator)
- [x] Cache Redis (cache-manager + ioredis)
- [x] Upload fichiers (Multer + Sharp WebP)
- [x] Push Notifications (web-push VAPID)
- [x] Email (Nodemailer)
- [x] Sécurité (Helmet CSP, throttler, compression)
- [x] PerformanceInterceptor + GlobalExceptionFilter
- [x] Health check endpoint

### Frontend Web
- [x] React 18.2 + TypeScript + Vite 5
- [x] State management (Zustand 4.x)
- [x] TanStack Query 5.x (API calls)
- [x] React Router v6
- [x] Design system custom (Button, Modal, Input, Select, etc.)
- [x] Tailwind CSS 3.4 + CSS Variables (thèmes)
- [x] PWA (manifest + service worker + Workbox)
- [x] Offline support (cache strategies, offline page)
- [x] Push Notifications (VAPID + Web Push API)
- [x] Animations (Framer Motion 12.x)
- [x] i18n (i18next, 7 namespaces, fr/en)
- [x] Charts (Recharts 3.x)
- [x] Accessibilité WCAG AA

### Infrastructure
- [x] Docker Compose (9 services dev)
- [x] Docker Compose production
- [x] Scripts de backup/restore
- [x] MariaDB 10.11 + Redis 7
- [x] MailHog (dev email testing)

---

## 💡 Recommandations Finales

### Stack Retenue
1. **Backend** : NestJS 10.3 + TypeScript 5.3 + TypeORM 0.3
2. **Frontend Web** : React 18.2 + TypeScript + Vite 5 + Tailwind 3.4
3. **Mobile** : PWA (Workbox + Web Push + Web Share)
4. **Database** : MariaDB 10.11 + Redis 7
5. **Storage** : Système de fichiers local (storage/)
6. **Deploy** : Docker Compose

### Priorités
1. ✅ **API REST stable** : Base solide pour le frontend PWA
2. ✅ **PWA fonctionnel** : Expérience web + mobile moderne
3. ✅ **Sécurité** : Helmet CSP, rate limiting, JWT, bcryptjs
4. ✅ **Documentation** : WorkFlow complet, CHANGELOG, STATUS
5. ✅ **UX/UI soigné** : Animations, skeletons, accessibilité

---

**Ce document définit l'architecture complète du système SnowShelf v2, validée et conforme à l'implémentation actuelle.**
