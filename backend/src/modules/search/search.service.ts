import {
  Injectable,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Item } from '../../database/entities/item.entity';
import { Category } from '../../database/entities/category.entity';
import { GlobalSearchDto, SuggestDto } from './dto/search.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private hasFulltextIndex = false;

  constructor(
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(Category)
    private readonly catRepo: Repository<Category>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly dataSource: DataSource,
  ) {
    // Check for FULLTEXT index availability
    this.checkFulltextIndex();
  }

  private async checkFulltextIndex() {
    try {
      const indexes: any[] = await this.dataSource.query(
        `SHOW INDEX FROM items WHERE Key_name = 'ft_items_search'`,
      );
      this.hasFulltextIndex = indexes.length > 0;
    } catch {
      this.hasFulltextIndex = false;
    }
  }

  // ──────────────────────────────────────────────
  // GLOBAL SEARCH (items + categories)
  // ──────────────────────────────────────────────
  async globalSearch(userId: number, dto: GlobalSearchDto, lang = 'fr') {
    const scope = dto.scope || 'all';
    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 20, 50);
    const searchTerm = dto.q.trim();

    // Try cache first
    const cacheKey = `search:${userId}:${scope}:${searchTerm}:${page}:${limit}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const results: any = {
      items: [],
      categories: [],
      itemsTotal: 0,
      categoriesTotal: 0,
    };

    // Search items
    if (scope === 'all' || scope === 'items') {
      const itemResult = await this.searchItems(userId, searchTerm, page, limit, lang);
      results.items = itemResult.items;
      results.itemsTotal = itemResult.total;
    }

    // Search categories
    if (scope === 'all' || scope === 'categories') {
      const catResult = await this.searchCategories(userId, searchTerm, page, limit);
      results.categories = catResult.categories;
      results.categoriesTotal = catResult.total;
    }

    const response = {
      success: true,
      data: {
        query: searchTerm,
        scope,
        ...results,
        pagination: {
          page,
          limit,
        },
      },
    };

    // Cache for 2 minutes
    await this.cacheManager.set(cacheKey, response, 120);

    // Save to search history
    await this.addToHistory(userId, searchTerm);

    return response;
  }

  // ──────────────────────────────────────────────
  // SEARCH ITEMS (FULLTEXT + LIKE fallback)
  // ──────────────────────────────────────────────
  private async searchItems(
    userId: number,
    searchTerm: string,
    page: number,
    limit: number,
    lang: string,
  ) {
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.primaryType', 'pt')
      .leftJoinAndSelect('item.categories', 'cat')
      .leftJoinAndSelect('item.status', 'status')
      .where('item.userId = :userId', { userId })
      .andWhere('item.deletedAt IS NULL');

    if (this.hasFulltextIndex && searchTerm.length >= 2) {
      const sanitized = searchTerm.replace(/[+\-><()~*"@]/g, '').trim();
      if (sanitized) {
        qb.andWhere(
          `MATCH(item.name, item.description) AGAINST(:search IN BOOLEAN MODE)`,
          { search: `*${sanitized}*` },
        );
        // Add relevance score for sorting
        qb.addSelect(
          `MATCH(item.name, item.description) AGAINST(:searchScore IN BOOLEAN MODE)`,
          'relevance',
        );
        qb.setParameter('searchScore', `*${sanitized}*`);
        qb.orderBy('relevance', 'DESC');
      }
    } else {
      qb.andWhere(
        '(item.name LIKE :searchLike OR item.description LIKE :searchLike)',
        { searchLike: `%${searchTerm}%` },
      );
      qb.orderBy('item.name', 'ASC');
    }

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        primaryType: item.primaryType
          ? {
              key: item.primaryType.keyName,
              name: lang === 'en' ? item.primaryType.nameEn : item.primaryType.nameFr,
              icon: item.primaryType.icon,
            }
          : null,
        rating: item.rating,
        marketValue: item.marketValue != null ? Number(item.marketValue) : null,
        searchState: item.searchState,
        status: item.status
          ? { id: item.status.id, name: item.status.name, color: item.status.color, icon: item.status.icon }
          : null,
        categories: (item.categories || []).map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
        })),
        createdAt: item.createdAt,
        type: 'item' as const,
      })),
      total,
    };
  }

  // ──────────────────────────────────────────────
  // SEARCH CATEGORIES
  // ──────────────────────────────────────────────
  private async searchCategories(
    userId: number,
    searchTerm: string,
    page: number,
    limit: number,
  ) {
    const qb = this.catRepo
      .createQueryBuilder('cat')
      .where('cat.deletedAt IS NULL')
      .andWhere('(cat.userId = :userId OR cat.userId IS NULL)', { userId })
      .andWhere(
        '(cat.name LIKE :search OR cat.description LIKE :search)',
        { search: `%${searchTerm}%` },
      )
      .orderBy('cat.name', 'ASC');

    const total = await qb.getCount();
    const categories = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        itemsCount: cat.itemsCount,
        type: 'category' as const,
      })),
      total,
    };
  }

  // ──────────────────────────────────────────────
  // SUGGESTIONS (autocomplete)
  // ──────────────────────────────────────────────
  async getSuggestions(userId: number, dto: SuggestDto) {
    const searchTerm = dto.q.trim();
    const limit = Math.min(dto.limit || 8, 20);

    // Check cache
    const cacheKey = `suggest:${userId}:${searchTerm}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get item name suggestions
    const items = await this.itemRepo
      .createQueryBuilder('item')
      .select(['item.id', 'item.name'])
      .leftJoinAndSelect('item.primaryType', 'pt')
      .where('item.userId = :userId', { userId })
      .andWhere('item.deletedAt IS NULL')
      .andWhere('item.name LIKE :search', { search: `%${searchTerm}%` })
      .orderBy('item.name', 'ASC')
      .limit(limit)
      .getMany();

    // Get category suggestions
    const categories = await this.catRepo
      .createQueryBuilder('cat')
      .select(['cat.id', 'cat.name', 'cat.icon', 'cat.slug'])
      .where('cat.deletedAt IS NULL')
      .andWhere('(cat.userId = :userId OR cat.userId IS NULL)', { userId })
      .andWhere('cat.name LIKE :search', { search: `%${searchTerm}%` })
      .orderBy('cat.name', 'ASC')
      .limit(3)
      .getMany();

    // Get history suggestions
    const history = await this.getHistory(userId);
    const historySuggestions = history
      .filter((h) => h.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 3);

    const response = {
      success: true,
      data: {
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          icon: i.primaryType?.icon || '📦',
          type: 'item' as const,
        })),
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          type: 'category' as const,
        })),
        history: historySuggestions,
      },
    };

    // Cache for 30 seconds
    await this.cacheManager.set(cacheKey, response, 30);

    return response;
  }

  // ──────────────────────────────────────────────
  // SEARCH HISTORY (Redis)
  // ──────────────────────────────────────────────
  private async addToHistory(userId: number, query: string) {
    try {
      const key = `search_history:${userId}`;
      const history: string[] = (await this.cacheManager.get(key)) || [];
      // Remove duplicate if exists, then add to front
      const filtered = history.filter(
        (h) => h.toLowerCase() !== query.toLowerCase(),
      );
      filtered.unshift(query);
      // Keep last 20 searches
      const trimmed = filtered.slice(0, 20);
      // Store for 30 days
      await this.cacheManager.set(key, trimmed, 30 * 24 * 3600);
    } catch (err) {
      this.logger.warn('Failed to save search history: ' + err.message);
    }
  }

  async getHistory(userId: number): Promise<string[]> {
    try {
      const key = `search_history:${userId}`;
      return (await this.cacheManager.get<string[]>(key)) || [];
    } catch {
      return [];
    }
  }

  async clearHistory(userId: number) {
    try {
      const key = `search_history:${userId}`;
      await this.cacheManager.del(key);
    } catch (err) {
      this.logger.warn('Failed to clear search history: ' + err.message);
    }
    return { success: true, message: 'Historique de recherche effacé' };
  }

  async removeHistoryEntry(userId: number, query: string) {
    try {
      const key = `search_history:${userId}`;
      const history: string[] = (await this.cacheManager.get(key)) || [];
      const filtered = history.filter(
        (h) => h.toLowerCase() !== query.toLowerCase(),
      );
      await this.cacheManager.set(key, filtered, 30 * 24 * 3600);
    } catch (err) {
      this.logger.warn('Failed to remove history entry: ' + err.message);
    }
    return { success: true, message: 'Entrée supprimée de l\'historique' };
  }
}
