# 💻 GUIDE DE DÉVELOPPEMENT - SnowShelf v2

> **Bonnes pratiques & conventions** - Standards de développement
> 
> **Date de création** : 20 février 2026
> **Status** : 📋 Guide complet

---

## 🎯 Philosophie de Développement

### Principes Fondamentaux

✅ **Clean Code** : Code lisible, maintenable, auto-documenté  
✅ **SOLID Principles** : Single Responsibility, Open/Closed, etc.  
✅ **DRY** : Don't Repeat Yourself  
✅ **KISS** : Keep It Simple, Stupid  
✅ **YAGNI** : You Aren't Gonna Need It  

### Culture d'Équipe

✅ **Code Review obligatoire** : Minimum 1 approbation  
✅ **Tests avant merge** : Coverage >80%  
✅ **Documentation continue** : Documenter en développant  
✅ **Communication transparente** : Slack, GitHub Discussions  

---

## 📁 Structure du Projet

### Monorepo Structure

```
snowshelf-v2/
├── backend/                  # Backend NestJS
│   ├── src/
│   │   ├── main.ts          # Point d'entrée
│   │   ├── app.module.ts    # Module racine
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   ├── config/          # Configuration (TypeORM, etc.)
│   │   ├── common/          # Code partagé
│   │   │   ├── decorators/  # @CurrentUser, @Public, @Roles
│   │   │   ├── guards/      # JwtAuthGuard, RolesGuard
│   │   │   ├── filters/     # AllExceptionsFilter
│   │   │   ├── interceptors/
│   │   │   ├── pipes/
│   │   │   └── dto/         # DTOs communs (pagination)
│   │   ├── database/
│   │   │   ├── entities/    # Entités TypeORM (User, Category, etc.)
│   │   │   ├── migrations/
│   │   │   └── seeds/       # Seeds (AdminSeed, PrimaryTypeSeed)
│   │   └── modules/         # Modules fonctionnels
│   │       ├── auth/        # AuthModule (register, login, JWT)
│   │       ├── users/       # UsersModule (profil, avatar)
│   │       ├── categories/  # CategoriesModule (CRUD, hiérarchie)
│   │       ├── primary-types/ # PrimaryTypesModule (11 types)
│   │       ├── notifications/ # NotificationsModule
│   │       └── mail/        # MailModule (nodemailer)
│   ├── storage/             # Fichiers uploadés
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # Frontend React
│   ├── src/
│   │   ├── main.tsx         # Point d'entrée React
│   │   ├── App.tsx          # Composant racine + Routes
│   │   ├── components/      # Composants réutilisables
│   │   │   ├── ui/          # Design system (13 composants CVA)
│   │   │   ├── layout/      # Header, Footer
│   │   │   └── common/      # ErrorBoundary, ProtectedRoute
│   │   ├── pages/           # Pages par feature
│   │   │   ├── auth/        # Login, Register, Verify, Forgot
│   │   │   ├── home/        # HomePage (landing + dashboard)
│   │   │   ├── categories/  # List, Form, Detail
│   │   │   ├── profile/     # Profile, Settings, Notifications
│   │   │   └── items/       # ItemsPage, ItemFormPage, ItemDetailPage ✅
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services (axios)
│   │   ├── stores/          # Zustand stores
│   │   ├── types/           # Types TypeScript
│   │   ├── theme/           # 43 thèmes (CSS vars)
│   │   ├── i18n/            # i18next (4 namespaces FR/EN)
│   │   ├── lib/             # Utilitaires (cn, utils)
│   │   └── assets/          # Images, styles
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── database/                 # Scripts BDD
│   ├── init.sql
│   ├── seeds/
│   └── migrations/
│
├── scripts/                  # Scripts utilitaires
├── WorkFLow/                 # Documentation complète
├── docker-compose.yml        # 9 services Docker
└── README.md
```

---

## 🔤 Conventions de Nommage

### Variables & Fonctions

```typescript
// ✅ GOOD: camelCase pour variables et fonctions
const userName = 'John';
const isAuthenticated = true;
function getUserById(id: number) { }
async function fetchItems() { }

// ❌ BAD
const user_name = 'John';
const UserName = 'John';
function get_user(id) { }
```

### Classes & Interfaces

```typescript
// ✅ GOOD: PascalCase pour classes, interfaces, types
class UserService { }
interface UserDto { }
type UserRole = 'free' | 'premium' | 'admin';

// ❌ BAD
class userService { }
interface userDto { }
```

### Fichiers

```typescript
// ✅ GOOD: kebab-case pour fichiers, .service.ts, .controller.ts suffixes
user.service.ts
auth.controller.ts
item-card.component.tsx
use-items.hook.ts

// ❌ BAD
UserService.ts
authController.ts
ItemCard.tsx
useItems.ts
```

### Constantes

```typescript
// ✅ GOOD: UPPER_SNAKE_CASE pour constantes globales
const MAX_UPLOAD_SIZE_MB = 50;
const API_BASE_URL = 'https://api.snowshelf.fr';

// ❌ BAD
const maxUploadSize = 50;
const apiBaseUrl = 'https://api.snowshelf.fr';
```

### Composants React

```typescript
// ✅ GOOD: PascalCase pour composants
export function ItemCard({ item }: ItemCardProps) { }
export const UserProfile: React.FC<UserProfileProps> = ({ user }) => { };

// ❌ BAD
export function itemCard() { }
export const user_profile = () => { };
```

---

## 🎨 Standards de Code

### Backend (NestJS)

#### Structure de Module

```typescript
// items/items.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item])],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService], // Si utilisé par d'autres modules
})
export class ItemsModule {}
```

#### Controller

```typescript
// items/items.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('items')
@ApiBearerAuth()
@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all items for current user' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully' })
  async findAll(@CurrentUser() user: User) {
    return this.itemsService.findAll({ userId: user.id });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({ status: 200, description: 'Item found' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.itemsService.findOne(+id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new item' })
  @ApiResponse({ status: 201, description: 'Item created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async create(
    @Body() createItemDto: CreateItemDto,
    @CurrentUser() user: User,
  ) {
    return this.itemsService.create(createItemDto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update item' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @CurrentUser() user: User,
  ) {
    return this.itemsService.update(+id, updateItemDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete item' })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.itemsService.remove(+id, user.id);
  }
}
```

#### Service

```typescript
// items/items.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto, UpdateItemDto, FindItemsDto } from './dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
  ) {}

  /**
   * Find all items for a user with optional filters
   * @param params - Filter parameters
   * @returns Array of items
   */
  async findAll(params: FindItemsDto): Promise<Item[]> {
    const { userId, categoryId, search, limit = 50, offset = 0 } = params;

    const queryBuilder = this.itemsRepository
      .createQueryBuilder('item')
      .where('item.userId = :userId', { userId })
      .andWhere('item.deletedAt IS NULL');

    if (categoryId) {
      queryBuilder.andWhere('item.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(item.name LIKE :search OR item.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    return queryBuilder
      .orderBy('item.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  /**
   * Find item by ID with ownership check
   * @param id - Item ID
   * @param userId - User ID
   * @throws NotFoundException if item not found
   * @throws ForbiddenException if user doesn't own item
   * @returns Item
   */
  async findOne(id: number, userId: number): Promise<Item> {
    const item = await this.itemsRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['category', 'metadata', 'images'],
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    if (item.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this item');
    }

    return item;
  }

  /**
   * Create new item
   * @param createItemDto - Item data
   * @param userId - User ID
   * @returns Created item
   */
  async create(createItemDto: CreateItemDto, userId: number): Promise<Item> {
    const item = this.itemsRepository.create({
      ...createItemDto,
      userId,
    });

    return this.itemsRepository.save(item);
  }

  /**
   * Update item
   * @param id - Item ID
   * @param updateItemDto - Update data
   * @param userId - User ID
   * @returns Updated item
   */
  async update(
    id: number,
    updateItemDto: UpdateItemDto,
    userId: number,
  ): Promise<Item> {
    const item = await this.findOne(id, userId);

    Object.assign(item, updateItemDto);

    return this.itemsRepository.save(item);
  }

  /**
   * Soft delete item
   * @param id - Item ID
   * @param userId - User ID
   */
  async remove(id: number, userId: number): Promise<void> {
    const item = await this.findOne(id, userId);

    await this.itemsRepository.update(id, {
      deletedAt: new Date(),
    });
  }
}
```

#### DTO (Data Transfer Object)

```typescript
// items/dto/create-item.dto.ts
import { IsString, IsNumber, IsOptional, IsBoolean, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ description: 'Item name', example: 'The Legend of Zelda: Breath of the Wild' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Category ID', example: 1 })
  @IsNumber()
  @Min(1)
  categoryId: number;

  @ApiPropertyOptional({ description: 'Item description', example: 'Nintendo Switch game' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Purchase price', example: 59.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({ description: 'Quantity', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Is favorite?', example: true })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
```

### Frontend (React)

#### Component Structure

```typescript
// components/features/ItemCard.tsx
import React from 'react';
import { Item } from '@/types/item';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/format';

/**
 * Item card component
 * Displays item information in a card format
 */
interface ItemCardProps {
  /** Item data */
  item: Item;
  /** Callback when edit button is clicked */
  onEdit: (item: Item) => void;
  /** Callback when delete button is clicked */
  onDelete: (id: number) => void;
  /** Optional className for styling */
  className?: string;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  className,
}) => {
  const handleEdit = () => {
    onEdit(item);
  };

  const handleDelete = () => {
    if (confirm(`Supprimer "${item.name}" ?`)) {
      onDelete(item.id);
    }
  };

  return (
    <Card className={className}>
      <div className="relative">
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        )}
        {item.isFavorite && (
          <span className="absolute top-2 right-2 text-yellow-500">⭐</span>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
        
        {item.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {item.purchasePrice && (
          <p className="text-green-600 font-medium mb-3">
            {formatCurrency(item.purchasePrice)}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEdit}
            aria-label="Edit item"
          >
            Éditer
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            aria-label="Delete item"
          >
            Supprimer
          </Button>
        </div>
      </div>
    </Card>
  );
};
```

#### Custom Hook

```typescript
// hooks/use-items.ts
import { useState, useEffect } from 'react';
import { Item, CreateItemDto, UpdateItemDto } from '@/types/item';
import { itemsApi } from '@/services/api/items';
import { useAuthStore } from '@/stores/auth';

/**
 * Custom hook for managing items
 * Provides CRUD operations and loading state
 */
export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  /**
   * Load all items for current user
   */
  const loadItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await itemsApi.getAll();
      setItems(data);
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create new item
   * @param dto - Item data
   */
  const createItem = async (dto: CreateItemDto) => {
    try {
      const newItem = await itemsApi.create(dto);
      setItems((prev) => [newItem, ...prev]);
      return newItem;
    } catch (err) {
      setError('Failed to create item');
      throw err;
    }
  };

  /**
   * Update existing item
   * @param id - Item ID
   * @param dto - Update data
   */
  const updateItem = async (id: number, dto: UpdateItemDto) => {
    try {
      const updated = await itemsApi.update(id, dto);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      return updated;
    } catch (err) {
      setError('Failed to update item');
      throw err;
    }
  };

  /**
   * Delete item
   * @param id - Item ID
   */
  const deleteItem = async (id: number) => {
    try {
      await itemsApi.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Failed to delete item');
      throw err;
    }
  };

  return {
    items,
    isLoading,
    error,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
  };
}
```

#### Zustand Store

```typescript
// stores/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: (user, accessToken) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),

      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

---

## 📝 Documentation du Code

### JSDoc pour TypeScript

```typescript
/**
 * Calculate the total value of items in a category
 * 
 * @param items - Array of items
 * @param categoryId - Category ID to filter by
 * @returns Total value in euros
 * 
 * @example
 * ```typescript
 * const total = calculateCategoryValue(items, 1);
 * console.log(total); // 459.99
 * ```
 * 
 * @throws {Error} If categoryId is invalid
 */
export function calculateCategoryValue(
  items: Item[],
  categoryId: number
): number {
  if (categoryId < 1) {
    throw new Error('Category ID must be positive');
  }

  return items
    .filter((item) => item.categoryId === categoryId)
    .reduce((sum, item) => sum + (item.currentValue || 0), 0);
}
```

---

## 🔀 Git Workflow

### Branch Naming

```bash
# Features
feature/user-authentication
feature/item-crud
feature/image-upload

# Bugfixes
fix/login-validation
fix/duplicate-categories

# Hotfixes (production)
hotfix/security-jwt-refresh

# Chores (refactoring, config)
chore/update-dependencies
chore/eslint-config
```

### Commit Messages

Format: `type(scope): subject`

```bash
# ✅ GOOD
feat(items): add search functionality
fix(auth): resolve token refresh bug
docs(api): update endpoints documentation
test(items): add unit tests for create item
refactor(users): simplify user service logic
chore(deps): update nestjs to v10

# ❌ BAD
updated stuff
fix bug
WIP
```

**Types** :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatting, lint
- `refactor`: Refactoring code
- `test`: Tests
- `chore`: Maintenance, dependencies

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Coverage >80%

## Screenshots (if applicable)
```

---

## ✅ Checklist Code Review

### Pour l'auteur (avant PR)
- [ ] Code fonctionne et a été testé localement
- [ ] Tests unitaires ajoutés (coverage >80%)
- [ ] Code formatté (Prettier)
- [ ] Pas de console.log oublié
- [ ] Variables/fonctions nommées clairement
- [ ] JSDoc pour fonctions publiques
- [ ] Types TypeScript stricts (pas de `any`)
- [ ] Gestion d'erreurs appropriée

### Pour le reviewer
- [ ] Code lisible et maintenable
- [ ] Logique métier correcte
- [ ] Performance acceptable
- [ ] Sécurité (pas de failles)
- [ ] Tests pertinents et passants
- [ ] Documentation suffisante
- [ ] Pas de duplication de code
- [ ] Respecte l'architecture existante

---

## 🚀 Workflow de Développement

```
1. Créer branche feature
   ↓
2. Développer + Tests
   ↓
3. Commit réguliers
   ↓
4. Push sur origin
   ↓
5. Ouvrir Pull Request
   ↓
6. CI/CD tests automatiques
   ↓
7. Code Review (minimum 1 approbation)
   ↓
8. Merge to develop
   ↓
9. Auto-deploy staging
   ↓
10. Tests QA
   ↓
11. Merge to main (release)
   ↓
12. Deploy production
```

---

## 📚 Ressources

### Style Guides
- **TypeScript** : https://github.com/microsoft/TypeScript/wiki/Coding-guidelines
- **React** : https://react.dev/learn/thinking-in-react
- **Airbnb JavaScript** : https://github.com/airbnb/javascript

### Tools
- **ESLint** : Linting
- **Prettier** : Formatting
- **Husky** : Git hooks
- **Commitlint** : Commit message validation

---

**Ce guide assure une qualité de code élevée et une collaboration efficace sur SnowShelf v2.**
