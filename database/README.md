# Database Scripts & Seeds

Ce dossier contient les scripts et seeds pour la base de données SnowShelf.

## Structure

```
database/
├── init.sql              # Script d'initialisation (structure)
├── migrations/           # Migrations TypeORM (gérées par le backend)
└── seeds/
    └── dev-seeds.sql    # Données de test pour développement
```

## Initialisation

Le script `init.sql` est automatiquement exécuté au premier démarrage du conteneur MariaDB via le docker-compose.

### Exécution manuelle

```bash
# Depuis le dossier racine du projet
docker exec -i snowshelf_mariadb mysql -u snowshelf_user -p snowshelf_db < database/init.sql
```

## Seeds de développement

Les seeds de développement créent des données de test (utilisateurs, articles, catégories, etc.).

### Utilisateurs de test

| Email | Username | Mot de passe | Rôle |
|-------|----------|--------------|------|
| admin@snowshelf.fr | admin | password123 | admin |
| john.doe@example.com | johndoe | password123 | user |
| jane.smith@example.com | janesmith | password123 | user |

### Données incluses

- **3 utilisateurs** avec préférences
- **11 catégories** réparties sur différents domaines
- **9 articles** de test (jeux vidéo, livres, LEGO)
- **8 tags** avec relations
- **11 mappings Tako API** vers les domaines

### Exécution

```bash
# Depuis le dossier racine du projet
docker exec -i snowshelf_mariadb mysql -u snowshelf_user -p snowshelf_db < database/seeds/dev-seeds.sql
```

Ou via le Makefile :

```bash
make db-seed
```

## Backups

### Créer un backup

```bash
./scripts/backup-db.sh
```

Les backups sont stockés dans `database/backups/` et automatiquement compressés.

### Restaurer un backup

```bash
# Restaurer le plus récent
./scripts/restore-db.sh

# Restaurer un fichier spécifique
./scripts/restore-db.sh database/backups/snowshelf_20240115_143022.sql.gz
```

## Migrations (TypeORM)

Les migrations sont gérées par TypeORM dans le backend NestJS.

```bash
# Depuis le dossier backend
npm run migration:generate -- src/database/migrations/NomDeLaMigration
npm run migration:run
npm run migration:revert
```

## Connexion directe

### Via Docker

```bash
docker exec -it snowshelf_mariadb mysql -u snowshelf_user -p snowshelf_db
```

### Via phpMyAdmin

Accès web : http://localhost:8080

- Serveur : `snowshelf_mariadb`
- Utilisateur : `snowshelf_user`
- Mot de passe : `snowshelf_password`
- Base : `snowshelf_db`

## Schéma de base de données

Le schéma complet est documenté dans : `WorkFLow/05-BASE_DE_DONNEES_SCHEMA.md`

### Tables principales

1. **users** - Utilisateurs de l'application
2. **domains** - Domaines de collection (11 domaines)
3. **categories** - Catégories par domaine
4. **items** - Articles de collection
5. **media** - Médias (images, vidéos)
6. **tags** - Tags pour organiser les articles
7. **tako_api_config** - Configuration Tako API
8. **tako_api_domain_mapping** - Mapping domaines ↔ Tako API

## Tako API

Tako API est configuré pour fonctionner avec 11 domaines :

1. construction-toys (LEGO, etc.)
2. videogames (consoles, jeux)
3. books (livres)
4. comics (BD, comics)
5. anime-manga (mangas, anime)
6. media (films, séries)
7. boardgames (jeux de société)
8. collectibles (figurines, objets rares)
9. tcg (cartes à collectionner)
10. music (CD, vinyles)
11. ecommerce (général)

La configuration par défaut pointe vers : `http://snowshelf_tako_api:3000`

> **Note** : Les clés API des providers externes sont gérées exclusivement dans le `.env` de Tako_Api. Aucune clé n'est stockée dans la table `tako_api_config` de SnowShelf.
