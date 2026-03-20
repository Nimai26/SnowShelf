# Guide de Contribution - SnowShelf v2

Merci de votre intérêt pour contribuer à SnowShelf v2 ! Ce document vous guide à travers le processus de contribution.

## 📋 Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Processus de développement](#processus-de-développement)
- [Standards de code](#standards-de-code)
- [Tests](#tests)
- [Documentation](#documentation)
- [Pull Requests](#pull-requests)

## 📜 Code de conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite :

- Soyez respectueux et inclusif
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est meilleur pour la communauté
- Faites preuve d'empathie envers les autres membres

## 🤝 Comment contribuer

### Signaler un bug

1. Vérifiez que le bug n'est pas déjà signalé dans les [Issues](https://github.com/Nimai26/SnowShelf2/issues)
2. Créez une nouvelle issue avec le template "Bug Report"
3. Incluez :
   - Description claire du problème
   - Étapes pour reproduire
   - Comportement attendu vs observé
   - Captures d'écran si pertinent
   - Environnement (OS, navigateur, version)

### Proposer une fonctionnalité

1. Vérifiez la [Roadmap](WorkFLow/07-ROADMAP_FONCTIONNALITES.md)
2. Créez une issue avec le template "Feature Request"
3. Décrivez :
   - Le besoin/problème à résoudre
   - La solution proposée
   - Les alternatives envisagées
   - L'impact sur le projet

### Corriger un bug ou ajouter une fonctionnalité

1. Fork le projet
2. Créez une branche depuis `develop`
3. Implémentez vos changements
4. Testez votre code
5. Soumettez une Pull Request

## 🔄 Processus de développement

### Workflow Git

Nous utilisons **Git Flow** :

```
main          # Production (stable)
  └── develop # Développement (intégration)
       └── feature/nom-fonctionnalité  # Nouvelles fonctionnalités
       └── bugfix/nom-bug              # Corrections de bugs
       └── hotfix/nom-fix              # Corrections urgentes
```

### Branches

#### Feature branch

```bash
# Créer une feature branch depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/ma-nouvelle-fonctionnalite
```

#### Bugfix branch

```bash
# Créer une bugfix branch depuis develop
git checkout develop
git pull origin develop
git checkout -b bugfix/correction-du-bug
```

#### Hotfix branch

```bash
# Créer une hotfix branch depuis main
git checkout main
git pull origin main
git checkout -b hotfix/correction-urgente
```

### Commits

Format des messages de commit :

```
<type>(<scope>): <description courte>

[Corps du message optionnel]

[Footer optionnel]
```

**Types** :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage (pas de changement de code)
- `refactor`: Refactoring
- `test`: Ajout/modification de tests
- `chore`: Tâches de maintenance

**Exemples** :

```bash
feat(backend): add user authentication module

Implement JWT authentication with refresh tokens
- Add AuthModule, AuthController, AuthService
- Configure Passport JWT strategy
- Add guards and decorators

Closes #42
```

```bash
fix(frontend): correct login form validation

- Fix email validation regex
- Add password strength indicator
- Improve error messages

Fixes #156
```

## 📝 Standards de code

### Backend (NestJS + TypeScript)

- **Linter** : ESLint + Prettier
- **Style** : Airbnb TypeScript Style Guide
- **Naming** :
  - Classes : `PascalCase`
  - Méthodes/Fonctions : `camelCase`
  - Constantes : `UPPER_SNAKE_CASE`
  - Fichiers : `kebab-case.ts`

```typescript
// ✅ Bon
export class UserService {
  async findUserById(id: number): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }
}

// ❌ Mauvais
export class user_service {
  async FindUserById(ID: number) {
    return this.userRepository.findOne({ where: { id: ID } });
  }
}
```

### Frontend (React + TypeScript)

- **Linter** : ESLint + Prettier
- **Style** : React Best Practices
- **Naming** :
  - Composants : `PascalCase`
  - Hooks : `useCamelCase`
  - Fichiers : `PascalCase.tsx` (composants) ou `camelCase.ts` (utils)

```typescript
// ✅ Bon
export function UserProfile({ userId }: UserProfileProps) {
  const { data: user } = useUser(userId);
  
  return (
    <div className="user-profile">
      <h1>{user?.name}</h1>
    </div>
  );
}

// ❌ Mauvais
export function user_profile({ userId }) {
  const user = useUser(userId).data;
  
  return <div><h1>{user?.name}</h1></div>;
}
```

### Formatage automatique

```bash
# Backend
cd backend
npm run format
npm run lint

# Frontend
cd frontend
npm run format
npm run lint
```

## 🧪 Tests

### Backend

```bash
cd backend

# Tests unitaires
npm test

# Tests with coverage
npm run test:cov

# Tests E2E
npm run test:e2e
```

**Couverture minimum requise** : 80%

### Frontend

```bash
cd frontend

# Linter
npm run lint

# Build test
npm run build
```

### Exemple de test backend

```typescript
describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should create a user', async () => {
    const userData = { email: 'test@example.com', username: 'test' };
    const user = await service.create(userData);
    
    expect(user).toHaveProperty('id');
    expect(user.email).toBe(userData.email);
  });
});
```

## 📖 Documentation

### Code

- Documentez les fonctions complexes avec JSDoc
- Ajoutez des commentaires pour la logique non évidente
- Mettez à jour le README si nécessaire

```typescript
/**
 * Calcule la valeur totale d'une collection d'articles
 * @param items - Liste des articles
 * @param currency - Devise pour la conversion (défaut: EUR)
 * @returns Valeur totale dans la devise spécifiée
 */
export function calculateCollectionValue(
  items: Item[],
  currency: Currency = 'EUR'
): number {
  // Logique de calcul...
}
```

### API

- Documentez les endpoints avec Swagger/OpenAPI
- Incluez des exemples de requêtes/réponses

```typescript
@ApiOperation({ summary: 'Créer un nouvel article' })
@ApiResponse({ 
  status: 201, 
  description: 'Article créé avec succès',
  type: Item 
})
@ApiResponse({ 
  status: 400, 
  description: 'Données invalides' 
})
@Post()
async create(@Body() createItemDto: CreateItemDto): Promise<Item> {
  return this.itemsService.create(createItemDto);
}
```

## 🔀 Pull Requests

### Checklist avant soumission

- [ ] Le code compile sans erreurs
- [ ] Les tests passent
- [ ] Le linter ne remonte aucune erreur
- [ ] La couverture de tests est maintenue/améliorée
- [ ] La documentation est mise à jour
- [ ] Les commits suivent le format établi
- [ ] La PR est liée à une issue

### Template de PR

```markdown
## Description
Brève description des changements

## Type de changement
- [ ] Bug fix (changement non breaking qui corrige un bug)
- [ ] Nouvelle fonctionnalité (changement non breaking qui ajoute une fonctionnalité)
- [ ] Breaking change (correction ou fonctionnalité qui change le comportement existant)
- [ ] Documentation

## Tests effectués
Description des tests réalisés

## Checklist
- [ ] Code testé localement
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] Pas de warning dans la console
- [ ] Les migrations DB sont incluses (si applicable)

## Captures d'écran (si applicable)

## Issues liées
Closes #123
```

### Processus de review

1. **Soumission** : Créez la PR vers `develop`
2. **Review** : Au moins 1 approbation requise
3. **Tests** : GitHub Actions doit passer
4. **Merge** : Squash and merge dans `develop`

### Critères d'acceptation

- ✅ Code propre et lisible
- ✅ Tests passants
- ✅ Documentation à jour
- ✅ Pas de conflits
- ✅ Respect des standards
- ✅ Approbation d'un mainteneur

## 🚀 Déploiement

### Develop → Main

Les merge de `develop` vers `main` sont réservés aux mainteneurs lors des releases.

**Process** :
1. Créer un tag de version : `git tag -a v1.2.0 -m "Release 1.2.0"`
2. Push le tag : `git push origin v1.2.0`
3. GitHub Actions construit et déploie automatiquement

## 💡 Conseils

### Bonnes pratiques

1. **Petites PR** : Gardez vos PR focalisées et de taille raisonnable
2. **Tests** : Testez votre code avant de soumettre
3. **Documentation** : Pensez aux futurs développeurs
4. **Communication** : Discutez des changements importants d'abord
5. **Patience** : Les reviews peuvent prendre du temps

### Ressources

- [Documentation NestJS](https://docs.nestjs.com/)
- [React Best Practices](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)

## 🆘 Besoin d'aide ?

- 📖 Consultez la [documentation](WorkFLow/)
- 💬 Posez vos questions dans les [Discussions](https://github.com/Nimai26/SnowShelf2/discussions)
- 🐛 Signalez un bug dans les [Issues](https://github.com/Nimai26/SnowShelf2/issues)
- 📧 Contactez : admin@snowshelf.fr

## 🎉 Merci !

Vos contributions font de SnowShelf un meilleur projet. Merci de prendre le temps de contribuer ! 🙏
