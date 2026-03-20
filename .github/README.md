# GitHub Actions - CI/CD

Ce dossier contient les workflows GitHub Actions pour l'intégration continue et le déploiement continu de SnowShelf v2.

## Workflows disponibles

### 1. Backend CI (`backend-ci.yml`)

Déclenché sur :
- Push sur `main` et `develop` (si changements dans `backend/`)
- Pull requests vers `main` et `develop`

Étapes :
1. **Test** : Linter + Tests unitaires + Couverture de code
2. **Build** : Construction de l'application NestJS
3. **Upload** : Artifacts de build conservés 7 jours

### 2. Frontend CI (`frontend-ci.yml`)

Déclenché sur :
- Push sur `main` et `develop` (si changements dans `frontend/`)
- Pull requests vers `main` et `develop`

Étapes :
1. **Test** : Linter ESLint
2. **Build** : Construction Vite avec optimisations production
3. **Upload** : Artifacts de build conservés 7 jours

### 3. Docker Build & Push (`docker-build.yml`)

Déclenché sur :
- Push sur `main`
- Tags `v*` (releases)

Étapes :
1. **Backend** : Build + Push vers `nimai24/snowshelf2-backend`
2. **Frontend** : Build + Push vers `nimai24/snowshelf2-frontend`

Tags générés :
- `main` (dernière version de la branche main)
- `v1.0.0` (tags sémantiques)
- `sha-abc123` (hash du commit)

### 4. Deploy to Production (`deploy.yml`)

Déclenché sur :
- Tags `v*` (releases)
- Manuel via `workflow_dispatch`

Étapes :
1. **SSH** : Connexion au serveur de production
2. **Git** : Pull de la dernière version
3. **Docker** : Pull des images + Redémarrage des conteneurs
4. **Health Check** : Vérification que l'API répond
5. **Notification** : Succès ou échec du déploiement

## Configuration des Secrets

Les secrets suivants doivent être configurés dans GitHub :

### Docker Hub
- `DOCKER_USERNAME` : nimai24
- `DOCKER_PASSWORD` : Token Docker Hub (dckr_pat_...)

### API
- `API_URL` : URL de l'API en production (https://snowshelf.fr/api/v1)

### Déploiement SSH
- `DEPLOY_HOST` : 10.20.0.3 (IP du serveur Debian)
- `DEPLOY_USER` : Utilisateur SSH
- `DEPLOY_SSH_KEY` : Clé privée SSH pour l'authentification
- `DEPLOY_PORT` : Port SSH (défaut : 22)

## Configuration des secrets dans GitHub

1. Aller sur le dépôt GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Cliquer sur **New repository secret**
4. Ajouter chaque secret avec son nom et sa valeur

## Environnements

### Production

Configuré dans **Settings** → **Environments** → **production**

Protection rules recommandées :
- ✅ Required reviewers (1 personne minimum)
- ✅ Wait timer (5 minutes après déploiement)
- ✅ Deployment branches (tags `v*` uniquement)

## Badges de statut

Ajoutez ces badges dans le README.md principal :

```markdown
![Backend CI](https://github.com/Nimai26/SnowShelf2/actions/workflows/backend-ci.yml/badge.svg)
![Frontend CI](https://github.com/Nimai26/SnowShelf2/actions/workflows/frontend-ci.yml/badge.svg)
![Docker Build](https://github.com/Nimai26/SnowShelf2/actions/workflows/docker-build.yml/badge.svg)
```

## Workflow de développement

### Feature branch

```bash
git checkout -b feature/ma-fonctionnalité
# ... développement ...
git push origin feature/ma-fonctionnalité
```

→ GitHub Actions exécute les tests automatiquement sur la PR

### Merge sur develop

```bash
git checkout develop
git merge feature/ma-fonctionnalité
git push origin develop
```

→ Tests + Build automatiques

### Release sur main

```bash
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin main --tags
```

→ Tests + Build + Docker Push + Déploiement automatique

## Notifications

Pour recevoir des notifications :

1. **Email** : Configurer dans Settings → Notifications
2. **Slack** : Ajouter l'app GitHub dans votre workspace Slack
3. **Discord** : Utiliser un webhook Discord dans les workflows

## Monitoring

- **Actions** : Onglet "Actions" du dépôt GitHub
- **Logs** : Cliquer sur un workflow pour voir les logs détaillés
- **Artifacts** : Téléchargeables depuis chaque run (7 jours de rétention)

## Dépannage

### Échec de connexion SSH

```bash
# Tester manuellement la connexion
ssh -i ~/.ssh/deploy_key user@10.20.0.3 -p 22
```

### Échec Docker Push

Vérifier que le token Docker Hub est valide :
```bash
echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
```

### Échec des tests

Exécuter les tests localement :
```bash
cd backend && npm test
cd frontend && npm run lint
```

## Amélioration futures

- [ ] Ajouter des tests E2E avec Playwright/Cypress
- [ ] Intégrer SonarQube pour l'analyse de code
- [ ] Ajouter des notifications Slack/Discord
- [ ] Créer un workflow de rollback automatique
- [ ] Ajouter des tests de performance
- [ ] Intégrer Dependabot pour les mises à jour de dépendances
