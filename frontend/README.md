# SnowShelf Frontend

Frontend React + Vite + TailwindCSS pour l'application SnowShelf v2.

## Installation

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Installer les dépendances
npm install
```

## Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Lancer le linter
npm run lint

# Formater le code
npm run format
```

## Build

```bash
# Construction pour la production
npm run build

# Prévisualiser la production
npm run preview
```

## Structure du projet

```
src/
├── assets/               # Assets statiques
│   ├── images/          # Images
│   └── styles/          # CSS globaux
├── components/          # Composants React
│   ├── common/         # Composants réutilisables
│   └── layout/         # Layout (Header, Footer, etc.)
├── pages/              # Pages de l'application
│   ├── auth/          # Pages d'authentification
│   ├── home/          # Page d'accueil
│   ├── items/         # Pages des articles
│   └── profile/       # Pages de profil
├── hooks/             # Hooks React personnalisés
├── stores/            # Stores Zustand
├── services/          # Services API
├── types/             # Types TypeScript
├── utils/             # Fonctions utilitaires
├── App.tsx            # Composant racine
└── main.tsx           # Point d'entrée
```

## Technologies

- **React** 18.x - Bibliothèque UI
- **TypeScript** 5.x - Typage statique
- **Vite** 5.x - Build tool
- **TailwindCSS** 3.x - Framework CSS
- **React Router** 6.x - Routing
- **TanStack Query** 5.x - Gestion des données serveur
- **Zustand** 4.x - State management
- **Axios** - Client HTTP
- **Vite PWA** - Progressive Web App

## Variables d'environnement

Voir `.env.example` pour la liste complète des variables.

## PWA

L'application est une Progressive Web App:
- Installation possible sur mobile/desktop
- Fonctionne hors ligne (service worker)
- Manifest configuré

## Développement

Le serveur de développement inclut:
- Hot Module Replacement (HMR)
- Proxy vers le backend (`/api` → `http://snowshelf_backend:3000`)
- Support TypeScript
- Linting ESLint
- Formatage Prettier
