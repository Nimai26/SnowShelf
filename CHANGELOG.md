# Changelog

Toutes les modifications notables du projet SnowShelf seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Non publié]

### Prévu
- Application mobile React Native
- API publique
- Recherche par image similaire (Phase 2 - Google Lens-like)
- Champs personnalisés par catégorie (Sprint 19)

## [2.0.0] - 2026-02-22 (En développement)

### Ajouté

#### Infrastructure
- Architecture complète avec 9 services Docker
- Orchestration Docker Compose avec docker-compose.yml
- NGINX Proxy Manager pour reverse proxy et SSL
- phpMyAdmin pour administration de la base de données
- MailHog pour test des emails en développement
- Redis pour le cache et les sessions
- Tako API avec 32 providers sur 11 domaines

#### Backend (NestJS)
- Structure de base NestJS 10.x avec TypeScript
- Configuration TypeORM pour MariaDB 10.11
- Authentification JWT avec Passport
- Documentation API avec Swagger UI
- Health check endpoint
- Validation des données avec class-validator
- Filtres d'exception globaux
- Intercepteurs de logging
- DTOs de pagination
- Configuration des environnements (.env)
- Push Notifications backend (web-push, VAPID keys, PushService)
- Table push_subscriptions (endpoint, keys, deduplication SHA256, auto-cleanup)
- **Admin Module** (Sprint 11)
  - AdminService : dashboard stats, gestion utilisateurs, broadcast notifications
  - AdminController : 6 endpoints protégés `@Roles(ADMIN)`
  - GET /admin/dashboard — statistiques globales (users, items, categories, trends)
  - GET /admin/activity — activité récente (items, inscriptions)
  - GET /admin/users — liste paginée avec recherche et filtres
  - PUT /admin/users/:id/role — changement de rôle utilisateur
  - DELETE /admin/users/:id — suppression de compte
  - POST /admin/notifications/broadcast — notification système globale
- **Production Hardening** (Sprint 12)
  - GlobalExceptionFilter : logging structuré avec contexte (5xx=error, 4xx=warn)
  - PerformanceInterceptor : détection requêtes lentes (> 500ms)
  - Health check avancé : vérification DB + Redis + mémoire + uptime
  - Helmet CSP personnalisé (img-src, font-src, HSTS preload)
  - Redis caching sur PrimaryTypesService (TTL 1h, données quasi-statiques)
  - Thumbnails WebP automatiques via Sharp (400x400, quality 75)
  - I/O fichiers async (writeFile/unlink → fs/promises)
  - Reorder médias transactionnel (Promise.all dans transaction)
  - Backup amélioré (DB + storage + rotation + gzip)
- **Collections publiques & Exploration** (Sprint 14-15)
  - Page Explorer : recherche d’utilisateurs publics, grille profils
  - Profils publics : stats, catégories, items avec filtres, vue grille/liste
  - Visibilité collections : public / amis / privé
  - checkVisibility avec contrôle d’accès par relation d’amitié
- **Système d'amis** (Sprint 21)
  - FriendsModule : 10 endpoints API (demandes, accept/decline, block, remove)
  - Ajout d’ami par email (protection énumération emails)
  - Politique de demandes d’amis réglable (everyone/nobody)
  - Page Amis (3 onglets : amis, reçues, envoyées)
  - Bouton ami contextuel sur les profils publics
  - Notifications friend_request / friend_accepted
- **Scan barcode & OCR** (Sprint 20)
  - Scan code-barres temps réel (barcode-detector, EAN/ISBN/UPC)
  - OCR depuis photo (Tesseract.js, client-side)
  - Intégration recherche Tako depuis barcode/OCR
  - Sélecteur de catégorie dans le flux de scan
- **Duplication d'items** avec copie des médias et choix modal
- **Liaison Catégories ↔ Types d'objets** (Sprint 18) : primaryTypeId obligatoire, providers par défaut configurables
- **Adaptation Tako v2.0.1** : normalisation formats pour tous les domaines

#### Frontend (React)
- Application React 18 avec TypeScript
- Vite 5.x comme build tool
- TailwindCSS 3.x pour le styling
- React Router 6.x pour le routing
- TanStack Query pour la gestion des données serveur
- Zustand pour le state management
- Progressive Web App (PWA) avec vite-plugin-pwa
  - Manifest complet (5 tailles d'icônes dont maskable)
  - Service Worker Workbox (4 stratégies de cache runtime)
  - Bannière d'installation personnalisée (InstallPrompt)
  - Mise à jour automatique du SW (PWAUpdatePrompt)
- Navigation mobile (BottomNav 5 onglets + FAB)
- Push Notifications (Web Push API + VAPID)
- Mode offline (OfflineBanner, OfflinePage, cache strategies)
- Web Share API (partage natif + fallback clipboard)
- Badging API (badge icône app = notifications non lues)
- Pull-to-refresh tactile sur les listes
- Haptic feedback (navigator.vibrate)
- **Admin Panel** (Sprint 11)
  - AdminDashboardPage : 4 KPI cards, graphiques Recharts (AreaChart, BarChart, PieChart), activité récente, formulaire broadcast
  - AdminUsersPage : table responsive + cards mobile, recherche, filtre par rôle, pagination, modals changement rôle / suppression
  - Recharts : graphiques analytics (tendances inscriptions, items, répartition par type)
  - Routes admin protégées (`ProtectedRoute roles={['admin']}`)
  - Lien admin conditionnel dans le Header (ShieldCheck icon)
  - i18n namespace `admin` (FR/EN) — dashboard, users, broadcast
  - admin.service.ts : 6 endpoints API admin
  - admin.types.ts : DashboardStats, AdminUser, RecentActivity
- **Production Hardening** (Sprint 12)
  - Code splitting : React.lazy() + Suspense sur 20 pages
  - Vite manualChunks : vendor-react, vendor-ui, vendor-charts, vendor-state
  - LoadingPage comme fallback Suspense dans Layout
- **UX/UI Polish** (Sprint 13)
  - PageTransition : animations de transition de page (Framer Motion, fade-in + slide)
  - FadeIn, StaggerContainer, StaggerItem, ScaleIn : composants d'animation réutilisables
  - Stagger animations sur grilles ItemsPage, CategoriesPage et HomePage Dashboard
  - Skeletons améliorés : variants (text, circle, card), ItemCardSkeleton, CategoryCardSkeleton, ListSkeleton, GridSkeleton
  - ErrorState : composant dédié erreur avec icône, retry button, animation d'entrée
  - Tooltip : composant générique (top/bottom/left/right, delay, aria role)
  - EmptyState : animation d'entrée FadeIn ajoutée
  - ErrorBoundary : couleurs CSS vars (dark mode compatible)
  - OnboardingTutorial : 5 étapes interactives, progress dots, localStorage persistence, i18n FR/EN
  - Skip-to-content link pour navigation clavier
  - Attributs ARIA (role, aria-label, aria-selected) sur BottomNav
  - Focus-visible global ring, prefers-reduced-motion, .sr-only
  - Keyframes Tailwind : fade-in, scale-in, slide-in-from-bottom, slide-in-from-top
- Apple PWA meta tags (apple-touch-icon, status-bar-style)
- Layout responsive (Header, Footer, BottomNav mobile)
- Pages de base (Home, Login)
- Services API avec Axios
- Store d'authentification

#### Base de données
- Schéma complet MariaDB avec 11 tables :
  - `domains` : 11 domaines de collection
  - `categories` : Catégories par domaine
  - `users` : Utilisateurs avec rôles
  - `user_preferences` : Préférences utilisateur
  - `items` : Articles de collection
  - `tags` & `item_tags` : Système de tags
  - `media` & `item_media` : Gestion des médias
  - `tako_api_config` : Configuration Tako API
  - `tako_api_domain_mapping` : Mapping domaines ↔ Tako API
- Script d'initialisation (init.sql)
- Seeds de développement avec données de test
- Scripts de backup/restore automatiques

#### CI/CD
- GitHub Actions pour tests et build (backend + frontend)
- Workflow Docker Build & Push vers Docker Hub
- Workflow de déploiement automatique en production
- Configuration des secrets GitHub
- Badges de statut dans le README

#### Documentation
- README.md principal avec badges CI/CD
- Guide de démarrage rapide (QUICKSTART.md)
- Stack technique détaillé (TECHNOLOGIES.md)
- Guide de contribution (CONTRIBUTING.md)
- Changelog (ce fichier)
- Documentation complète dans WorkFLow/ (13 documents)
- README pour chaque module (backend, frontend, database, .github)

#### Outils de développement
- Makefile avec 30+ commandes helper
- Scripts de backup/restore de base de données
- Configuration ESLint + Prettier (backend & frontend)
- Configuration TypeScript stricte
- .gitignore complet
- .credentials sécurisé (GitHub + Docker Hub)

#### Tako API
- 32 providers de recherche
- 11 domaines supportés :
  1. construction-toys (LEGO, etc.)
  2. videogames (jeux vidéo, consoles)
  3. books (livres)
  4. comics (BD, comics)
  5. anime-manga (mangas, anime)
  6. media (films, séries)
  7. boardgames (jeux de société)
  8. collectibles (figurines)
  9. tcg (cartes à collectionner)
  10. music (CD, vinyles)
  11. ecommerce (général)
- Cache PostgreSQL pour optimisation
- FlareSolverr pour contournement anti-bot

### Modifié
- Migration de SWAG vers NGINX Proxy Manager
- Passage de stack PHP vers architecture moderne (NestJS + React)
- Consolidation de 22 API providers vers Tako API unifié
- URL de production : https://snowshelf.fr

### Déprécié
- Ancienne stack PHP/Symfony (v1.x)
- 22 providers API individuels (remplacés par Tako API)
- Configuration SWAG

### Retiré
- Code legacy de SnowShelf v1
- Dépendances PHP obsolètes
- Configuration Apache

### Sécurité
- Implémentation de Helmet pour sécurité HTTP
- Configuration CORS stricte
- Validation des entrées utilisateur
- Hashage des mots de passe avec bcrypt
- Tokens JWT avec refresh
- Variables sensibles dans .credentials (gitignore)

## [1.x.x] - Historique (Archive)

### SnowShelf v1 (PHP/Symfony)
- Application monolithique PHP
- 22 providers API individuels
- Base de données MySQL
- Interface Twig
- Déployé avec SWAG (Secure Web Application Gateway)

---

## Types de changements

- `Ajouté` : Nouvelles fonctionnalités
- `Modifié` : Changements dans des fonctionnalités existantes
- `Déprécié` : Fonctionnalités qui seront retirées
- `Retiré` : Fonctionnalités retirées
- `Corrigé` : Corrections de bugs
- `Sécurité` : Changements de sécurité

## Versioning

Ce projet suit [Semantic Versioning](https://semver.org/lang/fr/) :
- `MAJOR` : Changements incompatibles avec l'API
- `MINOR` : Nouvelles fonctionnalités rétrocompatibles
- `PATCH` : Corrections de bugs rétrocompatibles

---

**Légende** :
- [Non publié] : Changements en cours de développement
- [X.Y.Z] : Version publiée avec date
