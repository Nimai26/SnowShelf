import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Package, FolderOpen, Star, ArrowLeft } from 'lucide-react';
import { searchService } from '../../services/search.service';
import { Button, Card, Spinner, Badge, EmptyState, Input } from '../../components/ui';
import type { SearchItemResult, SearchCategoryResult } from '../../types/search.types';
import CategoryIcon from '../../components/common/CategoryIcon';

type Tab = 'all' | 'items' | 'categories';

export default function SearchResultsPage() {
  const { t } = useTranslation('common');
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const tab = (searchParams.get('tab') as Tab) || 'all';
  const page = Number(searchParams.get('page')) || 1;

  const [searchInput, setSearchInput] = useState(query);
  const [items, setItems] = useState<SearchItemResult[]>([]);
  const [categories, setCategories] = useState<SearchCategoryResult[]>([]);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [categoriesTotal, setCategoriesTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async () => {
    if (!query || query.length < 2) return;
    setLoading(true);
    try {
      const res = await searchService.globalSearch({
        q: query,
        scope: tab,
        page,
        limit: 20,
      });
      setItems(res.data.items);
      setCategories(res.data.categories);
      setItemsTotal(res.data.itemsTotal);
      setCategoriesTotal(res.data.categoriesTotal);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [query, tab, page]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const params = new URLSearchParams(searchParams);
    params.set('q', searchInput.trim());
    params.delete('page');
    setSearchParams(params, { replace: true });
  };

  const setTab = (newTab: Tab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', newTab);
    params.delete('page');
    setSearchParams(params, { replace: true });
  };

  const totalResults = itemsTotal + categoriesTotal;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back + Search */}
      <div className="mb-6">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back', 'Retour')}
        </Link>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('search.searchPlaceholder', 'Rechercher...')}
              className="pl-10"
              autoFocus
            />
          </div>
          <Button type="submit" variant="primary">
            {t('search.search', 'Rechercher')}
          </Button>
        </form>

        {query && !loading && (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {totalResults} {t('search.results', 'résultat(s)')} {t('search.for', 'pour')} «&nbsp;{query}&nbsp;»
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-[var(--color-border)]">
        {(['all', 'items', 'categories'] as Tab[]).map((t_tab) => {
          const count = t_tab === 'all' ? totalResults : t_tab === 'items' ? itemsTotal : categoriesTotal;
          const label =
            t_tab === 'all'
              ? t('search.all', 'Tout')
              : t_tab === 'items'
              ? t('search.items', 'Objets')
              : t('search.categories', 'Catégories');
          return (
            <button
              key={t_tab}
              type="button"
              onClick={() => setTab(t_tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === t_tab
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !query || query.length < 2 ? (
        <EmptyState
          icon={Search}
          title={t('search.enterQuery', 'Saisissez votre recherche')}
          description={t('search.enterQueryDesc', 'Tapez au moins 2 caractères pour lancer la recherche.')}
        />
      ) : totalResults === 0 ? (
        <EmptyState
          icon={Search}
          title={t('search.noResults', 'Aucun résultat')}
          description={t('search.noResultsDesc', 'Essayez avec d\'autres termes de recherche.')}
        />
      ) : (
        <div className="space-y-6">
          {/* Items section */}
          {(tab === 'all' || tab === 'items') && items.length > 0 && (
            <section>
              {tab === 'all' && (
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
                  <Package className="h-5 w-5" />
                  {t('search.items', 'Objets')} ({itemsTotal})
                </h2>
              )}
              <div className="space-y-2">
                {items.map((item) => (
                  <Link key={item.id} to={`/items/${item.id}`}>
                    <Card className="group flex cursor-pointer items-center gap-4 p-3 transition hover:shadow-md hover:border-[var(--color-primary)]">
                      <span className="text-2xl">{item.primaryType?.icon || '📦'}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] truncate">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-[var(--color-text-secondary)] truncate">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {item.categories.slice(0, 3).map((cat) => (
                            <span
                              key={cat.id}
                              className="inline-flex items-center gap-1 rounded-full bg-[var(--color-hover)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]"
                            >
                              <CategoryIcon icon={cat.icon || '📁'} iconType={cat.iconType} size="sm" /> {cat.name}
                            </span>
                          ))}
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
                      {item.status ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: item.status.color }}
                        >
                          {item.status.icon} {item.status.name}
                        </span>
                      ) : item.searchState ? (
                        <Badge variant={item.searchState === 'owned' ? 'success' : 'warning'} className="text-xs">
                          {item.searchState === 'owned' ? 'Possédé' : 'Recherché'}
                        </Badge>
                      ) : null}
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Categories section */}
          {(tab === 'all' || tab === 'categories') && categories.length > 0 && (
            <section>
              {tab === 'all' && (
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
                  <FolderOpen className="h-5 w-5" />
                  {t('search.categories', 'Catégories')} ({categoriesTotal})
                </h2>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                  <Link key={cat.id} to={`/categories/${cat.id}`}>
                    <Card className="group flex cursor-pointer items-center gap-3 p-4 transition hover:shadow-md hover:border-[var(--color-primary)]">
                      <CategoryIcon icon={cat.icon || '📁'} iconType={cat.iconType} size="xl" className="text-3xl" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)]">
                          {cat.name}
                        </h3>
                        {cat.description && (
                          <p className="text-xs text-[var(--color-text-secondary)] truncate">{cat.description}</p>
                        )}
                      </div>
                      <Badge variant="default">{cat.itemsCount} {t('search.items', 'objets')}</Badge>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Pagination (simple for now) */}
      {totalResults > 20 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('page', String(page - 1));
              setSearchParams(params, { replace: true });
            }}
          >
            ←
          </Button>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {t('search.page', 'Page')} {page}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set('page', String(page + 1));
              setSearchParams(params, { replace: true });
            }}
          >
            →
          </Button>
        </div>
      )}
    </div>
  );
}
