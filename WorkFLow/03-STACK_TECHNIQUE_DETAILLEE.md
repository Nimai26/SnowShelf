# 🛠️ STACK TECHNIQUE DÉTAILLÉE - SnowShelf v2

> **Document de référence** - Choix technologiques et justifications
> 
> **Date de création** : 20 février 2026
> **Status** : ✅ Validé

---

## 🎯 Vue d'Ensemble de la Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND WEB (PWA)                        │
├─────────────────────────────────────────────────────────────┤
│  React 18.2 + TypeScript + Vite 5                             │
│  Tailwind CSS 3.4 + Design System Custom + Framer Motion       │
│  Zustand + TanStack Query + React Router                     │
│  PWA (Workbox) + i18next + Recharts                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                MOBILE (PWA-first + RN optionnel)            │
├─────────────────────────────────────────────────────────────┤
│  PWA : Service Worker (Workbox) + Web App Manifest           │
│  APIs Web : getUserMedia, BarcodeDetector, Canvas 2D         │
│  Touch : pinch-to-zoom, drag & drop, swipe                  │
│  Fallback RN : Expo + React Navigation (si nécessaire)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                               │
├─────────────────────────────────────────────────────────────┤
│  NestJS 10.3 + TypeScript 5.3 + Node.js 20                   │
│  TypeORM 0.3 + class-validator + Passport (JWT)               │
│  Sharp + Nodemailer + web-push (VAPID)                        │
│  Helmet (CSP) + Throttler + compression                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                            │
├─────────────────────────────────────────────────────────────┤
│  MariaDB 10.11 + Redis 7                                     │
│  Docker Compose (9 services dev)                              │
│  GitHub Actions (CI/CD)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌐 Frontend Web - Stack Détaillée

### Core Framework

#### **React 18.2** 
```json
{
  "version": "^18.2.0",
  "justification": [
    "Écosystème le plus mature",
    "Server Components (future-proof)",
    "Concurrent rendering",
    "Huge community & libs",
    "Excellent pour PWA"
  ]
}
```

**Alternatives considérées** :
- ❌ Vue 3 : Moins de libs pour certains usages spécifiques
- ❌ Svelte : Écosystème plus petit
- ✅ React : Meilleur choix pour notre cas

#### **TypeScript 5.3+**
```json
{
  "version": "^5.3.0",
  "configuration": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "esModuleInterop": true
  },
  "justification": [
    "Type safety (moins de bugs)",
    "Meilleure DX (autocomplete)",
    "Refactoring facilité",
    "Documentation via types"
  ]
}
```

### Build Tool

#### **Vite 5+**
```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SnowShelf',
        short_name: 'SnowShelf',
        theme_color: '#1a1a2e',
        icons: [/* ... */]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.snowshelf\.fr\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache' }
          }
        ]
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
        }
      }
    }
  }
});
```

**Avantages Vite** :
- ⚡ HMR ultra-rapide (ESM natif)
- 📦 Build optimisé (Rollup)
- 🔌 Plugins riches (PWA, SVG, etc.)
- 🎯 Développé pour React/Vue/Svelte

### State Management

#### **Zustand 4+**
```typescript
// store/useCollectionStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface CollectionStore {
  items: Item[];
  filter: FilterState;
  viewMode: 'grid' | 'list';
  setItems: (items: Item[]) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  toggleViewMode: () => void;
}

export const useCollectionStore = create<CollectionStore>()(
  devtools(
    persist(
      (set) => ({
        items: [],
        filter: {},
        viewMode: 'grid',
        setItems: (items) => set({ items }),
        setFilter: (filter) => set((state) => ({ 
          filter: { ...state.filter, ...filter } 
        })),
        toggleViewMode: () => set((state) => ({ 
          viewMode: state.viewMode === 'grid' ? 'list' : 'grid' 
        }))
      }),
      { name: 'collection-storage' }
    )
  )
);
```

**Pourquoi Zustand ?**
- ✅ Simple et léger (1kb gzipped)
- ✅ Pas de boilerplate
- ✅ DevTools support
- ✅ Persist middleware
- ✅ TypeScript excellent

**Alternative : Redux Toolkit**
```typescript
// Si besoin de plus de structure
import { configureStore, createSlice } from '@reduxjs/toolkit';

const collectionSlice = createSlice({
  name: 'collection',
  initialState: { items: [], filter: {} },
  reducers: {
    setItems: (state, action) => { state.items = action.payload; },
    setFilter: (state, action) => { state.filter = { ...state.filter, ...action.payload }; }
  }
});

export const store = configureStore({
  reducer: {
    collection: collectionSlice.reducer
  }
});
```

### Data Fetching

#### **TanStack Query (React Query) 5+**
```typescript
// hooks/useItems.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export function useItems(filters: ItemFilters) {
  return useQuery({
    queryKey: ['items', filters],
    queryFn: () => api.items.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateItemDto) => api.items.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
}

// Usage dans composant
function CollectionPage() {
  const { data, isLoading, error } = useItems({ category: 'video-games' });
  const createItem = useCreateItem();
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <ItemGrid items={data.items} />
  );
}
```

**Pourquoi TanStack Query ?**
- ✅ Cache intelligent
- ✅ Refetch automatique
- ✅ Optimistic updates
- ✅ Offline support
- ✅ DevTools

### Routing

#### **React Router 6.21+**
```typescript
// routes/index.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Collection = lazy(() => import('@/pages/Collection'));
const Categories = lazy(() => import('@/pages/Categories'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'dashboard', element: <Dashboard /> },
      {
        path: 'collection',
        element: <Suspense fallback={<Spinner />}><Collection /></Suspense>,
        loader: collectionLoader,
      },
      {
        path: 'categories',
        element: <Categories />,
        loader: categoriesLoader,
      }
    ]
  },
  {
    path: '/auth',
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> }
    ]
  }
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

### UI Components

#### **Design System Custom (Tailwind CSS)**

Composants UI développés en interne avec Tailwind CSS + class-variance-authority + tailwind-merge.

```tsx
// components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-secondary hover:bg-secondary/80',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        ghost: 'hover:bg-accent',
        outline: 'border border-input bg-background hover:bg-accent',
      },
      size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4', lg: 'h-12 px-6', icon: 'h-10 w-10' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);
```

**Composants UI disponibles** :
- `Button` — variants: primary, secondary, danger, ghost, outline
- `Modal` — prop `open` (pas isOpen), overlay + animation
- `Input`, `Select`, `Textarea` — controlled components natifs
- `Spinner` — loading spinner + Skeleton (text, circle, card)
- `EmptyState`, `ErrorState` — états vides/erreur avec actions
- `Tooltip` — positionable (top/bottom/left/right)
- `PageTransition`, `FadeIn`, `ScaleIn`, `StaggerContainer` — animations
- `ItemCardSkeleton`, `CategoryCardSkeleton`, `GridSkeleton`, `ListSkeleton`

### Styling

#### **Tailwind CSS 3.4+**
```javascript
// tailwind.config.js
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... autres couleurs
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/forms'),
  ],
};
```

**CSS Variables (Thèmes)**
```css
/* app.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    /* ... */
  }

  [data-theme="dark"] {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    /* ... */
  }

  [data-theme="nord"] {
    --background: 220 16% 22%;
    --foreground: 218 27% 94%;
    --primary: 193 43% 67%;
    /* ... */
  }
}
```

### Forms & Validation

#### **Formulaires natifs React (controlled components)**
```typescript
// Approche : useState + controlled inputs, pas de librairie de formulaires
import { useState, FormEvent } from 'react';
import { Button, Input, Select } from '@/components/ui';

export function CreateItemForm() {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createItem = useCreateItem();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name || name.length < 3) errs.name = 'Nom trop court (min 3 caractères)';
    if (!categoryId) errs.categoryId = 'Catégorie requise';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await createItem.mutateAsync({ name, categoryId: Number(categoryId) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nom *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />
      <Select
        label="Catégorie *"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        error={errors.categoryId}
      >
        <option value="">Sélectionner...</option>
      </Select>
      <Button type="submit" disabled={createItem.isPending}>
        {createItem.isPending ? 'Création...' : 'Créer'}
      </Button>
    </form>
  );
}
```

> **Note** : La validation backend (class-validator) est la source de vérité.
> Le frontend fait une validation légère pour l'UX.

### Internationalization

#### **i18next + react-i18next**
```typescript
// i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    defaultNS: 'common',
    ns: ['common', 'auth', 'collection', 'categories'],
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
```

```typescript
// Usage dans composant
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation('collection');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('items_count', { count: 42 })}</p>
      <button onClick={() => i18n.changeLanguage('en')}>
        Switch to English
      </button>
    </div>
  );
}
```

### Animations

#### **Framer Motion**
```tsx
import { motion, AnimatePresence } from 'framer-motion';

export function ItemGrid({ items }: { items: Item[] }) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <ItemCard item={item} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
```

### PWA

#### **Workbox (via vite-plugin-pwa — generateSW mode)**
```typescript
// vite.config.ts — Configuration Workbox réelle
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
    navigateFallback: 'index.html',
    navigateFallbackDenylist: [/^\\/api\\//],
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      // API → NetworkFirst (timeout 10s, 200 entries, 24h)
      {
        urlPattern: /\\/api\\/v1\\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 200, maxAgeSeconds: 86400 }
        }
      },
      // User media → CacheFirst (500 entries, 30 jours)
      {
        urlPattern: /\\/storage\\/users\\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'user-media-cache',
          expiration: { maxEntries: 500, maxAgeSeconds: 2592000 }
        }
      },
      // External images → StaleWhileRevalidate (7 jours)
      {
        urlPattern: /books\\.google|media\\.rawg|covers\\.openlibrary/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'external-images-cache',
          expiration: { maxEntries: 200, maxAgeSeconds: 604800 }
        }
      },
      // Google Fonts → CacheFirst (1 an)
      {
        urlPattern: /fonts\\.googleapis|fonts\\.gstatic/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: { maxEntries: 30, maxAgeSeconds: 31536000 }
        }
      }
    ]
  }
})
```

---

## 📱 Mobile - Stratégie PWA-first

> **Approche retenue** : L'application web React/Vite est transformée en PWA complète.
> React Native reste une option de fallback si des limitations hardware se présentent.

### PWA — Configuration et APIs Natives

#### **vite-plugin-pwa — Manifest réel (implémenté)**
```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: [
    'pwa-64x64.png', 'pwa-192x192.png', 'pwa-512x512.png',
    'apple-touch-icon-180x180.png', 'pwa-maskable-512x512.png',
  ],
  manifest: {
    name: 'SnowShelf — Gestionnaire de Collections',
    short_name: 'SnowShelf',
    description: 'Gérez, organisez et valorisez vos collections.',
    theme_color: '#1e293b',
    background_color: '#0f172a',
    display: 'standalone',
    orientation: 'portrait-primary',
    start_url: '/',
    categories: ['collections', 'lifestyle', 'entertainment'],
    lang: 'fr',
    icons: [
      { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  devOptions: { enabled: false },
  // Workbox config — voir section PWA ci-dessus
})
```

#### **Hooks PWA React implémentés**
| Hook | Fichier | Usage |
|------|---------|-------|
| `usePWAInstall` | hooks/usePWAInstall.ts | beforeinstallprompt, bannière install, cooldown 7j |
| `usePushNotifications` | hooks/usePushNotifications.ts | Subscribe/unsubscribe VAPID, permission |
| `useOnlineStatus` | hooks/useOnlineStatus.ts | Détection online/offline |
| `usePullToRefresh` | hooks/usePullToRefresh.ts | Pull-to-refresh tactile |
| `useWebShare` | hooks/useWebShare.ts | Web Share API + fallback clipboard |

#### **Composants & Utilitaires PWA**
| Composant | Usage |
|-----------|-------|
| `BottomNav` | Navigation mobile 5 onglets + FAB (sm:hidden) |
| `InstallPrompt` | Bannière d'installation non intrusive |
| `OfflineBanner` / `OfflinePage` | Indicateurs hors connexion |
| `PWAUpdatePrompt` | Notification mise à jour SW |
| `PullToRefresh` | Wrapper pull-to-refresh pour listes |
| `utils/haptics.ts` | Feedback haptique (vibrate) |
| `utils/badging.ts` | Badging API (badge icône app) |

#### **APIs Web Natives utilisées**
```typescript
// Caméra — getUserMedia (utilisé par CameraCapture)
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
});

// Switch caméra front/back
const devices = await navigator.mediaDevices.enumerateDevices();
const cameras = devices.filter(d => d.kind === 'videoinput');

// Flash/Torch — MediaStreamTrack capabilities
const track = stream.getVideoTracks()[0];
const capabilities = track.getCapabilities();
if (capabilities.torch) {
  await track.applyConstraints({ advanced: [{ torch: true }] });
}

// Barcode — BarcodeDetector API (Chrome) + fallback QuaggaJS
if ('BarcodeDetector' in window) {
  const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'code_128', 'qr_code'] });
  const barcodes = await detector.detect(videoElement);
}

// Web Share API
await navigator.share({ title: item.name, url: window.location.href });

// Vibration (feedback tactile)
navigator.vibrate(50);

// Push Notifications (via Service Worker + web-push backend)
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: vapidPublicKey  // VAPID: web-push (backend)
});
// Backend: web-push ^3.6.7 — VAPID keys, sendNotification()
// Entity: push_subscriptions (endpoint, p256dh, auth, failureCount)
```

### Composants Mobile-Critical (Canvas natif, 0 dépendance externe)

Ces composants sont portés du projet v1 (.Back_up) et exploitent Canvas 2D + touch events :

| Composant | Lignes | APIs Web | Touch Support |
|-----------|--------|----------|---------------|
| **ImageEditor** | ~1400 | Canvas 2D, toBlob | Pinch-to-zoom, drag crop handles |
| **CameraCapture** | ~1300 | getUserMedia, torch | Pinch-to-zoom, tap focus |
| **BarcodeScanner** | ~465 | BarcodeDetector | Auto-scan continu |
| **DocumentViewer** | ~1400 | Dynamic import | Swipe pages |
| **MediaListManager** | ~1700 | Drag & Drop | Touch drag reorder |

### Option React Native (Future, si nécessaire)

Si les limitations PWA (ex: NFC, Bluetooth, accès fichiers OS) bloquent des features :

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.4",
    "expo": "~50.0.0",
    "@react-navigation/native": "^6.1.0",
    "react-native-paper": "^5.12.0",
    "zustand": "^4.4.0"
  }
}
```

> Le state management (Zustand), les thèmes, les traductions (i18n), et la logique métier
> seraient réutilisés via un package partagé `@snowshelf/shared`.

---

## ⚙️ Backend - Stack Détaillée

### Core Framework

#### **NestJS 10+**
```bash
# Installation
npm i -g @nestjs/cli
nest new backend

# Structure générée
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   └── ...
├── test/
├── nest-cli.json
└── package.json
```

### Database ORM

#### **TypeORM 0.3+**
```typescript
// entities/item.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number;

  @Column({ type: 'date', nullable: true })
  dateObtained: Date;

  @ManyToOne(() => User, user => user.items)
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

```typescript
// items.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
  ) {}

  async findAll(userId: number): Promise<Item[]> {
    return this.itemsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Item> {
    return this.itemsRepository.findOne({
      where: { id, userId },
    });
  }

  async create(createItemDto: CreateItemDto, userId: number): Promise<Item> {
    const item = this.itemsRepository.create({
      ...createItemDto,
      userId,
    });
    return this.itemsRepository.save(item);
  }
}
```

### Validation

#### **class-validator + class-transformer**
```typescript
// dto/create-item.dto.ts
import { IsString, IsOptional, IsInt, Min, Max, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  categoryId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  value?: number;

  @IsOptional()
  @IsDateString()
  dateObtained?: string;
}
```

### Authentication

#### **Passport + JWT**
```typescript
// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

```typescript
// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
```

### Cache

#### **@nestjs/cache-manager + Redis**
```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 300, // 5 minutes
    }),
  ],
})
export class AppModule {}
```

```typescript
// items.controller.ts
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('items')
@UseInterceptors(CacheInterceptor)
export class ItemsController {
  @Get()
  @CacheTTL(60) // 60 secondes
  async findAll(@Query() query: ItemQueryDto) {
    return this.itemsService.findAll(query);
  }
}
```

### Queue (Jobs)

> **Note** : Pas de système de queue (Bull) dans le projet actuel.
> Le traitement d'images (Sharp) est effectué de manière synchrone dans les services
> `ImageProcessingService` et `ItemMediaService`. Suffisant pour l'usage actuel.

### File Upload

#### **Multer + Sharp**
```typescript
// media.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as sharp from 'sharp';

@Controller('media')
export class MediaController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Optimize image
    await sharp(file.path)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(file.path.replace(file.filename, `optimized-${file.filename}.webp`));

    return { url: `/uploads/optimized-${file.filename}.webp` };
  }
}
```

### Notifications

#### **Web Push (VAPID)**

> Pas de WebSockets (Socket.io). Les notifications utilisent l'API Web Push
> avec le package `web-push` (VAPID keys).

```typescript
// notifications.service.ts
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService {
  constructor() {
    webpush.setVapidDetails(
      'mailto:contact@snowshelf.fr',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
  }

  async sendPush(subscription: PushSubscription, payload: NotificationPayload) {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  }
}
```

### Documentation

#### **Swagger (OpenAPI)**
```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('SnowShelf API')
    .setDescription('API de gestion de collections geek')
    .setVersion('2.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
```

```typescript
// items.controller.ts
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  @Get()
  @ApiOperation({ summary: 'Liste tous les items' })
  @ApiResponse({ status: 200, description: 'Items récupérés', type: [Item] })
  async findAll() {
    return this.itemsService.findAll();
  }
}
```

---

## 🗄️ Infrastructure - Stack Détaillée

### Container Database

#### **MariaDB 10.11**
```yaml
# docker-compose.yml
services:
  mariadb:
    image: mariadb:10.11
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mariadb_data:/var/lib/mysql
      - ./database/init:/docker-entrypoint-initdb.d
    ports:
      - "3307:3306"
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --max_connections=500
      - --innodb_buffer_pool_size=2G
```

### Cache & Queue

#### **Redis 7**
```yaml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
```

### Object Storage

#### **Système de fichiers local**

> Pas de Minio/S3. Les fichiers sont stockés directement sur le système de fichiers
> dans le dossier `storage/users/{userId}/`.

```
storage/
└── users/
    └── {userId}/
        ├── items/
        │   └── {itemId}/
        │       ├── original.jpg
        │       └── thumbnail.webp
        └── categories/
            └── {categoryId}/
                └── cover.jpg
```

Le module `FileServingController` sert les fichiers via des routes dédiées.
Le module `ImageProcessingService` gère la conversion WebP et le redimensionnement via Sharp.

### Monitoring

#### **Monitoring applicatif intégré**

Le monitoring est assuré par :
- **PerformanceInterceptor** : mesure la durée de chaque requête (log si > seuil)
- **GlobalExceptionFilter** : capture et log toutes les erreurs
- **Health check** : `GET /` retourne le statut de l'application
- **Redis** : métriques de cache (hit/miss via cache-manager)

> Note : Prometheus/Grafana peuvent être ajoutés ultérieurement en production.

### CI/CD

#### **GitHub Actions**
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t snowshelf-backend .
      - name: Push to registry
        run: docker push snowshelf-backend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Kubernetes
        run: kubectl set image deployment/snowshelf snowshelf=snowshelf-backend:${{ github.sha }}
```

---

## 📦 Package.json Complet (Exemples)

### Frontend Web
```json
{
  "name": "snowshelf-web",
  "version": "2.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "test": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@tanstack/react-query": "^5.17.9",
    "zustand": "^4.4.7",
    "axios": "^1.6.5",
    "i18next": "^25.8.13",
    "react-i18next": "^16.5.4",
    "framer-motion": "^12.34.3",
    "lucide-react": "^0.575.0",
    "recharts": "^3.7.0",
    "react-hot-toast": "^2.5.2",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "tailwind-merge": "^3.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11",
    "vite-plugin-pwa": "^0.17.4",
    "eslint": "^8.56.0"
  }
}
```

### Backend
```json
{
  "name": "snowshelf-backend",
  "version": "2.0.0",
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "build": "nest build",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\""
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/typeorm": "^10.0.1",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/swagger": "^7.1.17",
    "@nestjs/cache-manager": "^2.2.0",
    "typeorm": "^0.3.19",
    "mysql2": "^3.6.5",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "bcryptjs": "^3.0.3",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "cache-manager": "^7.2.8",
    "cache-manager-redis-store": "^2.0.0",
    "ioredis": "^5.9.3",
    "sharp": "^0.34.5",
    "web-push": "^3.6.7",
    "@nestjs/throttler": "^6.5.0",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "nodemailer": "^6.9.0",
    "uuid": "^9.0.0",
    "@nestjs/config": "^3.1.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.2.1",
    "@nestjs/schematics": "^10.0.3",
    "@nestjs/testing": "^10.3.0",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.10.6",
    "@types/passport-jwt": "^4.0.0",
    "@types/bcryptjs": "^2.4.6",
    "@typescript-eslint/eslint-plugin": "^6.18.1",
    "@typescript-eslint/parser": "^6.18.1",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "prettier": "^3.1.1",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.1",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
```

---

## 🎯 Conclusion

Cette stack technique offre :

✅ **Performance** : Vite 5, React 18.2, NestJS 10.3, TypeORM optimisé, Sharp WebP  
✅ **DX** : TypeScript partout, hot-reload, DevTools  
✅ **Sécurité** : Helmet CSP, rate limiting, JWT, bcryptjs  
✅ **Maintenabilité** : Architecture modulaire (17 modules), tests, documentation  
✅ **Moderne** : Technologies 2026, best practices  
✅ **Mobile** : PWA complète (Workbox, Push, Web Share, Badging, BottomNav)  
✅ **UX/UI** : Animations Framer Motion, skeletons, onboarding, accessibilité WCAG AA  

Tous les sprints (0-13) sont terminés.
