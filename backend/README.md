# SnowShelf Backend API

Backend NestJS pour l'application SnowShelf v2.

## Installation

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Installer les dépendances
npm install
```

## Développement

```bash
# Démarrer en mode développement
npm run start:dev

# Démarrer en mode debug
npm run start:debug
```

## Base de données

```bash
# Générer une migration
npm run migration:generate -- src/database/migrations/NomDeLaMigration

# Créer une migration vide
npm run migration:create -- src/database/migrations/NomDeLaMigration

# Lancer les migrations
npm run migration:run

# Annuler la dernière migration
npm run migration:revert

# Lancer les seeds
npm run seed
```

## Tests

```bash
# Tests unitaires
npm run test

# Tests en mode watch
npm run test:watch

# Couverture de code
npm run test:cov

# Tests e2e
npm run test:e2e
```

## Build

```bash
# Construction pour la production
npm run build

# Démarrer en production
npm run start:prod
```

## Linting et Formatage

```bash
# Linter
npm run lint

# Formatage du code
npm run format
```

## Documentation API

Swagger UI disponible sur: http://localhost:3000/api/docs

## Structure du projet

```
src/
├── config/              # Configuration (TypeORM, etc.)
├── common/             # Code partagé (decorators, guards, filters, etc.)
├── modules/            # Modules fonctionnels
│   ├── auth/          # Authentification JWT
│   ├── users/         # Gestion des utilisateurs
│   ├── items/         # Articles de collection
│   ├── categories/    # Catégories et domaines
│   ├── media/         # Gestion des médias
│   └── tako-api/      # Client Tako API
├── database/
│   ├── entities/      # Entités TypeORM
│   ├── migrations/    # Migrations de base de données
│   └── seeds/         # Données de seeds
├── app.module.ts      # Module racine
├── app.controller.ts  # Contrôleur racine
├── app.service.ts     # Service racine
└── main.ts            # Point d'entrée
```

## Variables d'environnement

Voir `.env.example` pour la liste complète des variables d'environnement.

## Technologies

- **NestJS** 10.x - Framework Node.js
- **TypeScript** 5.x
- **TypeORM** 0.3.x - ORM
- **MariaDB** 10.11 - Base de données
- **JWT** - Authentification
- **Swagger** - Documentation API
- **Jest** - Tests
