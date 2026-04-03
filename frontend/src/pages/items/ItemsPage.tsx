import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Star,
  SlidersHorizontal,
  X,
  Package,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Camera,
} from 'lucide-react';
import PullToRefresh from '../../components/common/PullToRefresh';
import { itemService } from '../../services/item.service';
import { categoryService, primaryTypeService } from '../../services/category.service';
import { statusService, type Status } from '../../services/status.service';
import { storageLocationService, type StorageLocation } from '../../services/storage-location.service';
import { Button, Card, Badge, EmptyState, Input, Select, GridSkeleton, ListSkeleton } from '../../components/ui';
import { StaggerContainer, StaggerItem } from '../../components/ui/Animations';
import type { ItemCompact, ItemQueryParams } from '../../types/item.types';
import CategorySelect from '../../components/common/CategorySelect';
import { getMediaUrl } from '../../utils/url';
import type { Category, PrimaryType } from '../../types/category.types';
import CategoryIcon from '../../components/common/CategoryIcon';
import { QuickAddModal } from '../../components/common/QuickAddModal';

export default function ItemsPage() {
  const { t } = useTranslation('items');
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<ItemCompact[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [primaryTypes, setPrimaryTypes] = useState<PrimaryType[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [aggregations, setAggregations] = useState({ totalValue: 0, avgRating: 0 });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Query state from URL params
  const currentPage = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const searchState = (searchParams.get('searchState') as 'looking' | 'owned') || undefined;
  const statusId = searchParams.get('statusId') ? Number(searchParams.get('statusId')) : undefined;
  const primaryTypeId = searchParams.get('primaryTypeId') ? Number(searchParams.get('primaryTypeId')) : undefined;
  const storageLocationId = searchParams.get('storageLocationId') ? Number(searchParams.get('storageLocationId')) : undefined;
  const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
  const minValue = searchParams.get('minValue') ? Number(searchParams.get('minValue')) : undefined;
  const maxValue = searchParams.get('maxValue') ? Number(searchParams.get('maxValue')) : undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;
  const sort = (searchParams.get('sort') as ItemQueryParams['sort']) || 'createdAt';
  const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';

  const [searchInput, setSearchInput] = useState(search);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput) {
        params.set('search', searchInput);
      } else {
        params.delete('search');
      }
      params.delete('page');
      setSearchParams(params, { replace: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load filter data
  useEffect(() => {
    Promise.all([
      categoryService.getCategories({ filter: 'all', limit: 100 }).then((res) => setCategories(res.data.categories)).catch(() => {}),
      primaryTypeService.getAll().then((res) => setPrimaryTypes(res.data)).catch(() => {}),
      statusService.getAll().then((res) => setStatuses(res.data)).catch(() => {}),
      storageLocationService.getAll().then((res) => setStorageLocations(res.data)).catch(() => {}),
    ]);
  }, []);

  // Load items
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: ItemQueryParams = {
        page: currentPage,
        limit: 24,
        sort,
        order,
      };
      if (search) params.search = search;
      if (categoryId) params.categoryId = categoryId;
      if (searchState) params.searchState = searchState;
      if (statusId) params.statusId = statusId;
      if (primaryTypeId) params.primaryTypeId = primaryTypeId;
      if (storageLocationId) params.storageLocationId = storageLocationId;
      if (minRating) params.minRating = minRating;
      if (minValue !== undefined) params.minValue = minValue;
      if (maxValue !== undefined) params.maxValue = maxValue;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await itemService.getItems(params);
      setItems(res.data.items);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
      setAggregations(res.data.aggregations);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, categoryId, searchState, statusId, primaryTypeId, storageLocationId, minRating, minValue, maxValue, dateFrom, dateTo, sort, order]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const updateParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.delete('page');
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = search || categoryId || searchState || statusId || primaryTypeId || storageLocationId || minRating || minValue !== undefined || maxValue !== undefined || dateFrom || dateTo;
  const activeFilterCount = [search, categoryId, searchState, statusId, primaryTypeId, storageLocationId, minRating, minValue, maxValue, dateFrom, dateTo].filter(v => v !== undefined && v !== '').length;

  // ─── RENDER ──────────────────────────────────
  return (
    <>
    <PullToRefresh onRefresh={loadItems}>
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('title')}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowQuickAdd(true)}>
            <Camera className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('quickAdd.button', 'Photo rapide')}</span>
          </Button>
          <Link to="/items/new">
            <Button variant="primary">
              <Plus className="mr-2 h-4 w-4" />
              {t('addItem')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      {total > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <Card className="flex items-center gap-3 p-4">
            <Package className="h-8 w-8 text-[var(--color-primary)]" />
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)]">{total}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{t('stats.totalItems')}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)]">
                {aggregations.totalValue > 0 ? `${aggregations.totalValue.toFixed(0)} €` : '—'}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">{t('stats.totalValue')}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <Star className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)]">
                {aggregations.avgRating > 0 ? `${aggregations.avgRating}/5` : '—'}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">{t('stats.avgRating')}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Search & filters bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="pl-10"
          />
        </div>

        {/* Search state filter */}
        <div className="flex gap-2">
          <Button
            variant={!searchState ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => updateParam('searchState', undefined)}
          >
            {t('filters.all')}
          </Button>
          <Button
            variant={searchState === 'owned' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => updateParam('searchState', 'owned')}
          >
            {t('filters.owned')}
          </Button>
          <Button
            variant={searchState === 'looking' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => updateParam('searchState', 'looking')}
          >
            {t('filters.looking')}
          </Button>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 rounded-lg border border-[var(--color-border)] p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`rounded p-1.5 transition ${viewMode === 'grid' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded p-1.5 transition ${viewMode === 'list' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Advanced filters toggle */}
        <Button
          variant={showFilters ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="mr-1 h-4 w-4" />
          {t('filters.advancedFilters')}
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-[var(--color-primary-foreground)] text-[var(--color-primary)] h-5 w-5 flex items-center justify-center text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <Card className="mb-6 p-4">
          {/* Row 1: Main filters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Category */}
            <CategorySelect
              label={t('filters.category')}
              value={categoryId?.toString() || ''}
              onChange={(val) => updateParam('categoryId', val || undefined)}
              options={categories}
              placeholder={t('filters.allCategories')}
            />

            {/* Primary Type */}
            <Select
              label={t('filters.primaryType', 'Type')}
              value={primaryTypeId?.toString() || ''}
              onChange={(e) => updateParam('primaryTypeId', e.target.value || undefined)}
              options={[
                { value: '', label: t('filters.allTypes', 'Tous les types') },
                ...primaryTypes.map((pt) => ({
                  value: String(pt.id),
                  label: `${pt.icon} ${pt.name}`,
                })),
              ]}
            />

            {/* Status */}
            <Select
              label={t('filters.status', 'Statut')}
              value={statusId?.toString() || ''}
              onChange={(e) => updateParam('statusId', e.target.value || undefined)}
              options={[
                { value: '', label: t('filters.allStatuses', 'Tous les statuts') },
                ...statuses.map((s) => ({
                  value: String(s.id),
                  label: `${s.icon} ${s.name}`,
                })),
              ]}
            />

            {/* Sort + Order */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  label={t('filters.sort')}
                  value={sort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  options={[
                    { value: 'createdAt', label: t('filters.sortDate') },
                    { value: 'name', label: t('filters.sortName') },
                    { value: 'value', label: t('filters.sortValue') },
                    { value: 'rating', label: t('filters.sortRating') },
                    { value: 'purchasePrice', label: t('filters.sortPrice', 'Prix') },
                    { value: 'dateObtained', label: t('filters.sortDateObtained', 'Date obtention') },
                  ]}
                />
              </div>
              <div className="w-24">
                <Select
                  label={t('filters.order', 'Ordre')}
                  value={order}
                  onChange={(e) => updateParam('order', e.target.value)}
                  options={[
                    { value: 'desc', label: '↓' },
                    { value: 'asc', label: '↑' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* More filters toggle */}
          <button
            type="button"
            onClick={() => setShowMoreFilters((v) => !v)}
            className="mt-3 flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
          >
            {showMoreFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showMoreFilters ? t('filters.lessFilters', 'Moins de filtres') : t('filters.moreFilters', 'Plus de filtres')}
          </button>

          {/* Row 2: Extra filters */}
          {showMoreFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Storage Location */}
              <Select
                label={t('filters.storageLocation', 'Emplacement')}
                value={storageLocationId?.toString() || ''}
                onChange={(e) => updateParam('storageLocationId', e.target.value || undefined)}
                options={[
                  { value: '', label: t('filters.allLocations', 'Tous les emplacements') },
                  ...storageLocations.map((loc) => ({
                    value: String(loc.id),
                    label: loc.name,
                  })),
                ]}
              />

              {/* Min Rating */}
              <Select
                label={t('filters.minRating', 'Note minimum')}
                value={minRating?.toString() || ''}
                onChange={(e) => updateParam('minRating', e.target.value || undefined)}
                options={[
                  { value: '', label: t('filters.allRatings', 'Toutes') },
                  { value: '1', label: '★ 1+' },
                  { value: '2', label: '★★ 2+' },
                  { value: '3', label: '★★★ 3+' },
                  { value: '4', label: '★★★★ 4+' },
                  { value: '5', label: '★★★★★ 5' },
                ]}
              />

              {/* Price range */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                  {t('filters.valueRange', 'Valeur (€)')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={minValue ?? ''}
                    onChange={(e) => updateParam('minValue', e.target.value || undefined)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={maxValue ?? ''}
                    onChange={(e) => updateParam('maxValue', e.target.value || undefined)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Date range */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                  {t('filters.dateRange', 'Date obtention')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFrom ?? ''}
                    onChange={(e) => updateParam('dateFrom', e.target.value || undefined)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                  <input
                    type="date"
                    value={dateTo ?? ''}
                    onChange={(e) => updateParam('dateTo', e.target.value || undefined)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                {t('filters.clearFilters')}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Content */}
      {loading ? (
        viewMode === 'grid' ? (
          <GridSkeleton count={8} />
        ) : (
          <ListSkeleton count={6} />
        )
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('noItems')}
          description={t('noItemsDesc')}
          action={
            <Link to="/items/new">
              <Button variant="primary">
                <Plus className="mr-2 h-4 w-4" />
                {t('addItem')}
              </Button>
            </Link>
          }
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <StaggerItem key={item.id}>
            <Link to={`/items/${item.id}`}>
              <Card className="group h-full cursor-pointer overflow-hidden transition hover:shadow-md hover:border-[var(--color-primary)]">
                {/* Thumbnail / fallback icon */}
                {item.thumbnailUrl ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-hover)]">
                    <img
                      src={`${getMediaUrl(item.thumbnailUrl)}`}
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-contain p-1"
                      loading="lazy"
                    />
                    {/* Rating overlay */}
                    {item.rating && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-yellow-400">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs font-medium">{item.rating}</span>
                      </div>
                    )}
                    {/* Type badge overlay */}
                    <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm">
                      {item.primaryType?.icon || '📦'}
                    </div>
                  </div>
                ) : (
                  <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-[var(--color-hover)]">
                    <span className="text-4xl opacity-60">{item.primaryType?.icon || '📦'}</span>
                    {item.rating && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-yellow-400">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs font-medium">{item.rating}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3">
                  {/* Name */}
                  <h3 className="mb-1 text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] line-clamp-2">
                    {item.name}
                  </h3>

                  {/* Description */}
                  {item.description && (
                    <p className="mb-2 text-xs text-[var(--color-text-secondary)] line-clamp-1">
                      {item.description}
                    </p>
                  )}

                  {/* Categories */}
                  {item.categories.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {item.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-flex items-center gap-1 rounded-full bg-[var(--color-hover)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]"
                        >
                          <CategoryIcon icon={cat.icon} iconType={cat.iconType} size="sm" /> {cat.name}
                        </span>
                      ))}
                      {item.categories.length > 2 && (
                        <span className="text-[10px] text-[var(--color-text-secondary)]">
                          +{item.categories.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                    {item.marketValue ? (
                      <span className="text-sm font-semibold text-green-500">
                        {Number(item.marketValue).toFixed(2)} €
                      </span>
                    ) : (
                      <span></span>
                    )}
                    <div className="flex items-center gap-1">
                      {item.status && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: item.status.color }}
                        >
                          {item.status.icon} {item.status.name}
                        </span>
                      )}
                      {!item.status && item.searchState && (
                        <Badge variant={item.searchState === 'owned' ? 'success' : 'warning'}>
                          {item.searchState === 'owned' ? t('filters.owned') : t('filters.looking')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        /* LIST VIEW */
        <StaggerContainer className="space-y-2">
          {items.map((item) => (
            <StaggerItem key={item.id}>
            <Link to={`/items/${item.id}`}>
              <Card className="group flex cursor-pointer items-center gap-4 p-3 transition hover:shadow-md hover:border-[var(--color-primary)]">
                {item.thumbnailUrl ? (
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-hover)]">
                    <img
                      src={`${getMediaUrl(item.thumbnailUrl)}`}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <span className="text-2xl">{item.primaryType?.icon || '📦'}</span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <span>{item.primaryType?.name}</span>
                    {item.categories.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{item.categories.map((c) => c.name).join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
                {item.rating && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-sm">{item.rating}</span>
                  </div>
                )}
                {item.marketValue && (
                  <span className="text-sm font-semibold text-green-500">
                    {Number(item.marketValue).toFixed(2)} €
                  </span>
                )}
                {item.status && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: item.status.color }}
                  >
                    {item.status.icon} {item.status.name}
                  </span>
                )}
                {!item.status && item.searchState && (
                  <Badge variant={item.searchState === 'owned' ? 'success' : 'warning'} className="text-xs">
                    {item.searchState === 'owned' ? t('filters.owned') : t('filters.looking')}
                  </Badge>
                )}
              </Card>
            </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => updateParam('page', String(currentPage - 1))}
          >
            ←
          </Button>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {currentPage} / {pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage >= pages}
            onClick={() => updateParam('page', String(currentPage + 1))}
          >
            →
          </Button>
        </div>
      )}
    </div>
    </PullToRefresh>

    {/* Quick Add Modal */}
    <QuickAddModal
      open={showQuickAdd}
      onClose={() => { setShowQuickAdd(false); loadItems(); }}
    />
    </>
  );
}
