# 🧪 STRATÉGIE DE TESTS - SnowShelf v2

> **Documentation complète des tests** - Garantie de qualité
> 
> **Date de création** : 20 février 2026
> **Status** : 📋 Stratégie complète

---

## 🎯 Philosophie de Test

### Pyramide de Tests

```
             ┌──────────────┐
            ╱ E2E Tests (5%) ╲
           ╱──────────────────╲
          ╱  Integration (15%)  ╲
         ╱────────────────────────╲
        ╱   Unit Tests (80%)       ╲
       ╱──────────────────────────────╲
```

### Principes
✅ **Fast Feedback** : Tests rapides en développement  
✅ **Reliable** : Pas de flakey tests  
✅ **Isolated** : Chaque test indépendant  
✅ **Maintainable** : Code de test propre  
✅ **Comprehensive** : Couverture >80%  

### Objectifs de Couverture

| Type | Backend | Frontend | Mobile |
|------|---------|----------|--------|
| Unit | >80% | >75% | >70% |
| Integration | >60% | >50% | >50% |
| E2E | Critical flows | Critical flows | Critical flows |

---

## 🔬 Tests Backend (NestJS)

### Tests Unitaires

#### Configuration Jest

```typescript
// backend/jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### Tests de Services

```typescript
// backend/src/items/items.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';

describe('ItemsService', () => {
  let service: ItemsService;
  let repository: Repository<Item>;

  // Mock repository
  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: getRepositoryToken(Item),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
    repository = module.get<Repository<Item>>(getRepositoryToken(Item));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of items', async () => {
      const items = [
        { id: 1, name: 'Item 1', categoryId: 1 },
        { id: 2, name: 'Item 2', categoryId: 1 },
      ];
      
      mockRepository.find.mockResolvedValue(items);

      const result = await service.findAll({ userId: 1 });

      expect(result).toEqual(items);
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 1, deletedAt: null },
        relations: ['category', 'metadata'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle empty results', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll({ userId: 1 });

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single item', async () => {
      const item = { id: 1, name: 'Item 1', userId: 1 };
      mockRepository.findOne.mockResolvedValue(item);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(item);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 1, deletedAt: null },
        relations: ['category', 'metadata', 'images'],
      });
    });

    it('should throw NotFoundException when item not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(
        'Item with ID 999 not found'
      );
    });

    it('should throw ForbiddenException when user does not own item', async () => {
      const item = { id: 1, name: 'Item 1', userId: 2 };
      mockRepository.findOne.mockResolvedValue(item);

      await expect(service.findOne(1, 1)).rejects.toThrow(
        'You do not have permission to access this item'
      );
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const createDto = { name: 'New Item', categoryId: 1 };
      const userId = 1;
      const createdItem = { id: 1, ...createDto, userId };

      mockRepository.create.mockReturnValue(createdItem);
      mockRepository.save.mockResolvedValue(createdItem);

      const result = await service.create(createDto, userId);

      expect(result).toEqual(createdItem);
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        userId,
      });
      expect(repository.save).toHaveBeenCalledWith(createdItem);
    });

    it('should throw BadRequestException for invalid data', async () => {
      const createDto = { name: '', categoryId: -1 };

      await expect(service.create(createDto, 1)).rejects.toThrow(
        'Invalid item data'
      );
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const updateDto = { name: 'Updated Item' };
      const existingItem = { id: 1, name: 'Old Item', userId: 1 };
      const updatedItem = { ...existingItem, ...updateDto };

      mockRepository.findOne.mockResolvedValue(existingItem);
      mockRepository.save.mockResolvedValue(updatedItem);

      const result = await service.update(1, updateDto, 1);

      expect(result).toEqual(updatedItem);
      expect(repository.save).toHaveBeenCalledWith({
        ...existingItem,
        ...updateDto,
      });
    });
  });

  describe('delete', () => {
    it('should soft delete an item', async () => {
      const item = { id: 1, name: 'Item', userId: 1 };
      
      mockRepository.findOne.mockResolvedValue(item);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.delete(1, 1);

      expect(repository.update).toHaveBeenCalledWith(
        { id: 1 },
        { deletedAt: expect.any(Date) }
      );
    });
  });
});
```

#### Tests de Controllers

```typescript
// backend/src/items/items.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

describe('ItemsController', () => {
  let controller: ItemsController;
  let service: ItemsService;

  const mockItemsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
      ],
    }).compile();

    controller = module.get<ItemsController>(ItemsController);
    service = module.get<ItemsService>(ItemsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of items', async () => {
      const items = [{ id: 1, name: 'Item 1' }];
      const user = { id: 1, email: 'test@example.com', role: 'free' };

      mockItemsService.findAll.mockResolvedValue(items);

      const result = await controller.findAll(user);

      expect(result).toEqual(items);
      expect(service.findAll).toHaveBeenCalledWith({ userId: user.id });
    });
  });

  describe('findOne', () => {
    it('should return a single item', async () => {
      const item = { id: 1, name: 'Item 1' };
      const user = { id: 1, email: 'test@example.com', role: 'free' };

      mockItemsService.findOne.mockResolvedValue(item);

      const result = await controller.findOne('1', user);

      expect(result).toEqual(item);
      expect(service.findOne).toHaveBeenCalledWith(1, user.id);
    });
  });

  describe('create', () => {
    it('should create an item', async () => {
      const createDto = { name: 'New Item', categoryId: 1 };
      const user = { id: 1, email: 'test@example.com', role: 'premium' };
      const created = { id: 1, ...createDto };

      mockItemsService.create.mockResolvedValue(created);

      const result = await controller.create(createDto, user);

      expect(result).toEqual(created);
      expect(service.create).toHaveBeenCalledWith(createDto, user.id);
    });
  });
});
```

### Tests d'Intégration

```typescript
// backend/test/items.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection } from 'typeorm';

describe('ItemsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Create test user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234!',
      })
      .expect(201);

    userId = registerResponse.body.user.id;

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test1234!',
      })
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Clean up database
    const connection = getConnection();
    await connection.synchronize(true);
    await app.close();
  });

  describe('/items (GET)', () => {
    it('should return empty array for new user', () => {
      return request(app.getHttpServer())
        .get('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect([]);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/items')
        .expect(401);
    });
  });

  describe('/items (POST)', () => {
    it('should create a new item', () => {
      return request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Item',
          categoryId: 1,
          description: 'Test description',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Item');
          expect(res.body.userId).toBe(userId);
        });
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '', // Invalid
          categoryId: -1, // Invalid
        })
        .expect(400);
    });

    it('should enforce rate limiting', async () => {
      // Make 100 requests rapidly
      const promises = Array(100)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/items')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Item', categoryId: 1 })
        );

      const results = await Promise.all(promises);
      const rateLimited = results.filter((r) => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('/items/:id (GET)', () => {
    let itemId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Item for GET test', categoryId: 1 });

      itemId = res.body.id;
    });

    it('should return item by id', () => {
      return request(app.getHttpServer())
        .get(`/items/${itemId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(itemId);
          expect(res.body.name).toBe('Item for GET test');
        });
    });

    it('should return 404 for non-existent item', () => {
      return request(app.getHttpServer())
        .get('/items/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/items/:id (PUT)', () => {
    let itemId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Item for PUT test', categoryId: 1 });

      itemId = res.body.id;
    });

    it('should update item', () => {
      return request(app.getHttpServer())
        .put(`/items/${itemId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Item' })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Item');
        });
    });
  });

  describe('/items/:id (DELETE)', () => {
    let itemId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Item for DELETE test', categoryId: 1 });

      itemId = res.body.id;
    });

    it('should soft delete item', async () => {
      await request(app.getHttpServer())
        .delete(`/items/${itemId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify item is not returned in list
      return request(app.getHttpServer())
        .get('/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.find((i) => i.id === itemId)).toBeUndefined();
        });
    });
  });
});
```

---

## ⚛️ Tests Frontend (React)

### Configuration Jest + Testing Library

```typescript
// frontend/jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};
```

```typescript
// frontend/src/setupTests.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

### Tests de Composants

```typescript
// frontend/src/components/ItemCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemCard } from './ItemCard';

describe('ItemCard', () => {
  const mockItem = {
    id: 1,
    name: 'Test Item',
    description: 'Test description',
    categoryId: 1,
    userId: 1,
    createdAt: new Date().toISOString(),
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders item information', () => {
    render(<ItemCard item={mockItem} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<ItemCard item={mockItem} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockItem);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<ItemCard item={mockItem} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockItem.id);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('displays placeholder when no image', () => {
    render(<ItemCard item={mockItem} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', '/placeholder.svg');
  });

  it('displays item image when available', () => {
    const itemWithImage = {
      ...mockItem,
      image: 'https://example.com/image.jpg',
    };

    render(<ItemCard item={itemWithImage} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', itemWithImage.image);
  });
});
```

### Tests de Hooks

```typescript
// frontend/src/hooks/useItems.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useItems } from './useItems';
import { server } from '../mocks/server';
import { rest } from 'msw';

describe('useItems', () => {
  it('loads items on mount', async () => {
    const { result } = renderHook(() => useItems());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('handles API errors', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    const { result } = renderHook(() => useItems());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBe('Failed to load items');
  });

  it('creates a new item', async () => {
    const { result } = renderHook(() => useItems());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const newItem = { name: 'New Item', categoryId: 1 };
    await result.current.createItem(newItem);

    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0].name).toBe('New Item');
  });
});
```

### Tests E2E (Playwright)

```typescript
// frontend/e2e/items.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Item Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display items list', async ({ page }) => {
    await page.goto('/items');
    await expect(page.locator('.item-card')).toHaveCount(2);
  });

  test('should create a new item', async ({ page }) => {
    await page.goto('/items');
    
    // Open create modal
    await page.click('button:has-text("New Item")');
    
    // Fill form
    await page.fill('[name="name"]', 'E2E Test Item');
    await page.selectOption('[name="categoryId"]', '1');
    await page.fill('[name="description"]', 'Created via E2E test');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('.toast-success')).toContainText('Item created');
    
    // Verify item appears in list
    await expect(page.locator('text=E2E Test Item')).toBeVisible();
  });

  test('should edit an item', async ({ page }) => {
    await page.goto('/items');
    
    // Click edit on first item
    await page.locator('.item-card').first().locator('button:has-text("Edit")').click();
    
    // Update name
    await page.fill('[name="name"]', 'Updated Item Name');
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator('.toast-success')).toContainText('Item updated');
    await expect(page.locator('text=Updated Item Name')).toBeVisible();
  });

  test('should delete an item', async ({ page }) => {
    await page.goto('/items');
    
    const initialCount = await page.locator('.item-card').count();
    
    // Click delete on first item
    await page.locator('.item-card').first().locator('button:has-text("Delete")').click();
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Verify deletion
    await expect(page.locator('.toast-success')).toContainText('Item deleted');
    await expect(page.locator('.item-card')).toHaveCount(initialCount - 1);
  });

  test('should search items', async ({ page }) => {
    await page.goto('/items');
    
    // Enter search query
    await page.fill('[placeholder="Search items..."]', 'Test');
    
    // Wait for results
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const items = page.locator('.item-card');
    const count = await items.count();
    
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).toContainText('Test', { ignoreCase: true });
    }
  });
});
```

---

## 📱 Tests Mobile (React Native)

### Configuration Jest

```javascript
// mobile/jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### Tests de Screens

```typescript
// mobile/src/screens/ItemsScreen.test.tsx
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { ItemsScreen } from './ItemsScreen';

describe('ItemsScreen', () => {
  it('renders loading state', () => {
    const { getByTestId } = render(<ItemsScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders items list', async () => {
    const { getByText } = render(<ItemsScreen />);

    await waitFor(() => {
      expect(getByText('Item 1')).toBeTruthy();
      expect(getByText('Item 2')).toBeTruthy();
    });
  });

  it('navigates to item detail on press', async () => {
    const mockNavigation = { navigate: jest.fn() };
    const { getByText } = render(<ItemsScreen navigation={mockNavigation} />);

    await waitFor(() => getByText('Item 1'));

    fireEvent.press(getByText('Item 1'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ItemDetail', {
      itemId: 1,
    });
  });
});
```

### Tests E2E (Detox)

```typescript
// mobile/e2e/items.e2e.ts
import { by, device, element, expect } from 'detox';

describe('Items Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    
    // Login
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Test1234!');
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.id('items-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display items list', async () => {
    await expect(element(by.id('item-1'))).toBeVisible();
    await expect(element(by.id('item-2'))).toBeVisible();
  });

  it('should create a new item', async () => {
    await element(by.id('add-item-button')).tap();
    
    await element(by.id('item-name-input')).typeText('Mobile Test Item');
    await element(by.id('item-category-picker')).tap();
    await element(by.text('Books')).tap();
    await element(by.id('save-button')).tap();
    
    await expect(element(by.text('Mobile Test Item'))).toBeVisible();
  });

  it('should capture photo for item', async () => {
    await element(by.id('add-item-button')).tap();
    await element(by.id('camera-button')).tap();
    
    // Take photo
    await element(by.id('capture-button')).tap();
    await element(by.id('confirm-photo-button')).tap();
    
    await expect(element(by.id('item-image-preview'))).toBeVisible();
  });
});
```

---

## 🔍 Tests de Performance

### Load Testing (k6)

```javascript
// tests/load/items-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp-up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp-up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  const BASE_URL = 'https://api.snowshelf.fr';
  
  // Login
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'loadtest@example.com',
    password: 'LoadTest1234!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  const token = loginRes.json('accessToken');
  
  // Get items
  const itemsRes = http.get(`${BASE_URL}/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  check(itemsRes, {
    'items retrieved': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

---

## 🛡️ Tests de Sécurité

### OWASP ZAP Automation

```yaml
# tests/security/zap-scan.yaml
env:
  contexts:
    - name: snowshelf
      urls:
        - https://staging.snowshelf.fr
      authentication:
        method: json
        parameters:
          loginUrl: https://api.snowshelf.fr/auth/login
          loginRequestData: '{"email":"security@test.com","password":"SecTest1234!"}'
        verification:
          method: response
          loggedInRegex: '\Q{"accessToken"\E'

jobs:
  - type: spider
    parameters:
      user: security@test.com
      maxDuration: 5
      
  - type: passiveScan-wait
    
  - type: activeScan
    parameters:
      user: security@test.com
      policy: API-Minimal
      
  - type: report
    parameters:
      template: traditional-html
      reportDir: /zap/reports
      reportFile: security-report.html
```

---

## ✅ Checklist Qualité

### Avant chaque Pull Request
- [ ] Tous les tests unitaires passent
- [ ] Coverage >80% (backend) / >75% (frontend)
- [ ] Tests d'intégration passent
- [ ] Pas de warnings linter
- [ ] Code documenté (JSDoc)
- [ ] Tests pour les nouveaux features

### Avant chaque déploiement
- [ ] Tests E2E passent
- [ ] Load tests passants
- [ ] Security scan clean
- [ ] Performance validée (<2s load)
- [ ] Tests manuels sur staging

---

## 📊 Reporting

### Coverage Reports

```bash
# Backend
cd backend && npm run test:cov
open coverage/lcov-report/index.html

# Frontend
cd frontend && npm run test:coverage
open coverage/lcov-report/index.html

# Upload to Codecov
bash <(curl -s https://codecov.io/bash)
```

### Test Results Dashboard

```yaml
# .github/workflows/test-report.yml
name: Test Report

on: [push, pull_request]

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - name: Publish test results
        uses: EnricoMi/publish-unit-test-result-action@v2
        with:
          files: |
            backend/coverage/junit.xml
            frontend/coverage/junit.xml
```

---

**Cette stratégie assure une qualité de code élevée avec une couverture de tests complète pour SnowShelf v2.**
