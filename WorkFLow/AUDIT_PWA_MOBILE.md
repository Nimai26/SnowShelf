# 📱 AUDIT PWA & COMPATIBILITÉ MOBILE — SnowShelf

> **Date de l'audit** : 28 février 2026  
> **Statut** : 📋 En attente — À traiter après la phase de tests et améliorations  
> **Contexte** : Vérification que l'objectif "application smartphone" du cahier des charges n'a pas été perdu de vue.

---

## 🎯 Rappel de la stratégie mobile

> **Stratégie retenue** (doc 07-ROADMAP, Phase 4) :  
> PWA d'abord (installable, offline, push), React Native ensuite si nécessaire.

---

## ✅ Ce qui est en place (11/16)

| # | Fonctionnalité | Fichiers clés | Notes |
|---|---|---|---|
| 1 | **Manifest complet** | `vite.config.ts` (généré par vite-plugin-pwa) | name, icons 64/192/512/maskable, screenshots, standalone, categories |
| 2 | **Service Worker Workbox** | `vite.config.ts` (4 stratégies runtime) | NetworkFirst API, CacheFirst médias, StaleWhileRevalidate images externes, CacheFirst fonts |
| 3 | **Push Notifications** | `hooks/usePushNotifications.ts`, `backend/modules/notifications/` | VAPID backend + PushManager frontend, subscribe/unsubscribe |
| 4 | **Install Prompt** | `hooks/usePWAInstall.ts`, `components/common/InstallPrompt.tsx` | beforeinstallprompt, détection standalone, dismiss 7j |
| 5 | **Bottom Nav mobile** | `components/layout/BottomNav.tsx` | 5 onglets, bouton central surélevé, `sm:hidden`, safe-area-bottom |
| 6 | **Offline Banner** | `hooks/useOnlineStatus.ts`, `components/common/OfflineBanner.tsx` | Détection online/offline, bannière amber dans Layout |
| 7 | **Pull-to-refresh** | `hooks/usePullToRefresh.ts` | Touch events natifs, seuil configurable, effet de résistance |
| 8 | **Web Share API** | `hooks/useWebShare.ts` | `navigator.share()` natif + fallback clipboard, partage items/catégories |
| 9 | **PWA Icons** | `public/pwa-*.png`, `public/apple-touch-icon-*.png` | 64, 192, 512, maskable 512, apple 180 |
| 10 | **Responsive design** | Toutes les pages | Breakpoints Tailwind `sm:` `md:` `lg:` `xl:` systématiques |
| 11 | **Lazy loading pages** | `App.tsx` | React.lazy + Suspense sur 20+ pages, code splitting vendor |
| 12 | **Meta tags mobile** | `index.html` | viewport-fit=cover, theme-color, apple-mobile-web-app-capable/status-bar-style/title |
| 13 | **Badging API** | `hooks/usePushNotifications.ts` | `navigator.setAppBadge()` pour notifications non lues |

---

## ⚠️ Partiel / À améliorer (5 points)

### 1. Safe area insets incomplets
- **Actuel** : Seul `BottomNav.tsx` utilise `pb-[env(safe-area-inset-bottom)]`
- **Manque** : `safe-area-inset-top` (notch iPhone, Dynamic Island), `safe-area-inset-left/right` (mode paysage)
- **Fichiers à modifier** : `index.css` (global), `Layout.tsx` (header), composants plein écran
- **Effort** : Faible (~15 min)

### 2. OfflinePage non routée
- **Actuel** : Le composant `pages/OfflinePage.tsx` existe mais aucune `<Route>` ne pointe dessus dans `App.tsx`
- **Compensation** : L'`OfflineBanner` dans le Layout compense partiellement
- **Action** : Soit router OfflinePage, soit la supprimer si l'approche Banner suffit
- **Effort** : Faible (~5 min)

### 3. TakoSearchModal pas responsive mobile
- **Actuel** : `max-w-3xl` fixe, pas de classes `sm:`, grille de providers et résultats non adaptés petit écran (375px)
- **Action** : Adapter la grille, les cartes résultats, le layout providers pour mobile
- **Effort** : Moyen (~30 min)

### 4. TakoImportPreview pas responsive mobile
- **Actuel** : Grille images 5 colonnes fixe (`grid-cols-5`), layout champs non adapté mobile
- **Action** : `grid-cols-3 sm:grid-cols-5`, adapter les FieldRow pour petit écran
- **Effort** : Faible (~15 min)

### 5. Optimisations touch CSS globales absentes
- **Actuel** : Aucun CSS touch global (`touch-action`, `-webkit-tap-highlight-color`, `overscroll-behavior`)
- **Impact** : Délai de 300ms au tap sur certains navigateurs, highlight bleu au tap, overscroll du body
- **Action** : Ajouter dans `index.css` les règles touch standards
- **Effort** : Faible (~10 min)

---

## ❌ Non implémenté (cahier des charges Sprint 9-10)

### Priorité HAUTE

| Fonctionnalité | Roadmap | Description | Effort estimé |
|---|---|---|---|
| **BarcodeScanner** | Sprint 8 (reporté) | BarcodeDetector API native + fallback QuaggaJS. Formats : EAN-13/8, UPC-A/E, Code 128/39, QR, Data Matrix. Seuil 2 détections. Retour haptique. | 2-3 jours |
| **IndexedDB offline** | Sprint 10 | Stockage local des collections, sync bidirectionnelle pull/push, queue d'opérations offline, résolution de conflits | 3-5 jours |

### Priorité MOYENNE

| Fonctionnalité | Roadmap | Description | Effort estimé |
|---|---|---|---|
| **Background Sync** | Sprint 9 | Uploads en mode offline via SyncManager + workbox-background-sync. Les médias ajoutés offline sont envoyés au retour de connexion. | 1-2 jours |
| **Virtual Scrolling** | Sprint 10 | react-virtual / @tanstack/virtual pour les grandes listes (>100 items). Améliore la fluidité mobile. | 1 jour |
| **Tests Lighthouse > 90** | Sprint 10 | Audit Lighthouse PWA, Performance, Accessibility, Best Practices. Corriger les points < 90. | 1 jour |

### Priorité BASSE

| Fonctionnalité | Roadmap | Description | Effort estimé |
|---|---|---|---|
| **Share Target API** | Sprint 10 | Recevoir des partages d'autres apps → ouvrir le formulaire d'ajout avec l'image reçue | 0.5 jour |
| **Long press actions** | Sprint 9 | Actions contextuelles sur appui long (supprimer, éditer, partager) sur les items des listes | 1 jour |
| **Swipe-to-delete** | Sprint 9 | Glissé horizontal pour supprimer sur les listes d'items | 1 jour |
| **Gestion quota storage** | Sprint 10 | `navigator.storage.estimate()` pour avertir l'utilisateur avant saturation du cache | 0.5 jour |
| **Download HD à la demande** | Sprint 10 | Thumbnails en cache, images HD téléchargées uniquement à l'ouverture | 0.5 jour |

### Optionnel / Futur

| Fonctionnalité | Description |
|---|---|
| **React Native (Expo)** | Seulement si les limitations PWA bloquent des features critiques. Réutilisation des services/stores/types. |
| **DocumentViewer** | Viewer PDF (pdfjs), EPUB (epubjs), CBZ/CBR (libarchive.js), ZIP (jszip) |
| **File Handling API** | Ouvrir des fichiers depuis le système directement dans l'app |

---

## 📊 Plan d'action recommandé

### Phase 1 : Quick wins (1 demi-journée)
1. CSS touch globales dans `index.css`
2. Safe area insets complets
3. Responsive TakoImportPreview + TakoSearchModal
4. Décision OfflinePage (router ou supprimer)

### Phase 2 : Features mobiles essentielles (1 semaine)
1. BarcodeScanner (avec fallback)
2. Virtual Scrolling pour listes longues
3. Audit Lighthouse + corrections

### Phase 3 : Offline avancé (1-2 semaines)
1. IndexedDB + sync bidirectionnelle
2. Background Sync uploads
3. Gestion quota storage

### Phase 4 : Polish mobile (selon besoins)
1. Long press / swipe-to-delete
2. Share Target API
3. Gestes de navigation entre onglets

---

## 📝 Notes

- L'architecture actuelle (React SPA + Workbox + hooks PWA) est solide et bien structurée pour le mobile
- La majorité du travail "smartphone" est déjà fait (75%+)
- Les ajouts récents (TakoImportPreview, tooltips touch) sont compatibles mobile mais nécessitent un polish responsive
- Le BarcodeScanner reste la fonctionnalité manquante la plus impactante pour l'usage réel mobile d'une app de collection
- **À traiter une fois la phase de tests en conditions réelles terminée**
