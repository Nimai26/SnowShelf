import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, ChevronDown, ChevronRight, Shield, Globe, User, Filter } from 'lucide-react';
import type { Category, PrimaryType } from '../../types/category.types';
import { useAuthStore } from '../../stores/authStore';

type SourceFilter = 'default' | 'public' | 'mine';

interface TypeInfo {
  id: number;
  key: string;
  name: string;
  icon: string;
  color: string;
}

interface CategorySelectorProps {
  categories: Category[];
  primaryTypes: PrimaryType[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  /** Called when a category is toggled — useful for auto-selecting primary type */
  onToggle?: (categoryId: number, selected: boolean) => void;
}

export function CategorySelector({
  categories,
  primaryTypes: _primaryTypes,
  selectedIds,
  onChange,
  onToggle,
}: CategorySelectorProps) {
  const { t } = useTranslation('items');
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilters, setSourceFilters] = useState<Set<SourceFilter>>(new Set());
  const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // --- Filtering logic ---

  const filteredCategories = useMemo(() => {
    let result = categories;

    // Source filter
    if (sourceFilters.size > 0) {
      result = result.filter((cat) => {
        if (sourceFilters.has('default') && cat.isDefault) return true;
        if (sourceFilters.has('public') && cat.isPublic && !cat.isDefault) return true;
        if (sourceFilters.has('mine') && cat.owner?.id === userId) return true;
        return false;
      });
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (cat) =>
          cat.name.toLowerCase().includes(q) ||
          cat.description?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [categories, sourceFilters, searchQuery, userId]);

  // --- Grouping by primary type ---

  const grouped = useMemo(() => {
    const groups: Record<string, { type: TypeInfo | null; cats: Category[] }> = {};

    for (const cat of filteredCategories) {
      const pt = cat.primaryType;
      const key = pt ? `type-${pt.id}` : 'no-type';

      if (!groups[key]) {
        groups[key] = { type: pt ?? null, cats: [] };
      }
      groups[key].cats.push(cat);
    }

    // Sort groups: types with selected categories first, then alphabetically
    return Object.entries(groups).sort(([, a], [, b]) => {
      const aHasSelected = a.cats.some((c) => selectedIds.includes(c.id));
      const bHasSelected = b.cats.some((c) => selectedIds.includes(c.id));
      if (aHasSelected && !bHasSelected) return -1;
      if (!aHasSelected && bHasSelected) return 1;
      const aName = a.type?.name ?? 'zzz';
      const bName = b.type?.name ?? 'zzz';
      return aName.localeCompare(bName);
    });
  }, [filteredCategories, selectedIds]);

  // --- Selected categories (for the top chips) ---

  const selectedCategories = useMemo(
    () => categories.filter((c) => selectedIds.includes(c.id)),
    [categories, selectedIds],
  );

  // --- Handlers ---

  const toggleCategory = useCallback(
    (catId: number) => {
      const isSelected = selectedIds.includes(catId);
      const next = isSelected
        ? selectedIds.filter((id) => id !== catId)
        : [...selectedIds, catId];
      onChange(next);
      onToggle?.(catId, !isSelected);
    },
    [selectedIds, onChange, onToggle],
  );

  const toggleSourceFilter = useCallback((filter: SourceFilter) => {
    setSourceFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  }, []);

  const toggleCollapse = useCallback((key: string) => {
    setCollapsedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const sourceFilterDefs: { key: SourceFilter; label: string; icon: typeof Shield }[] = [
    { key: 'default', label: t('categorySelector.default', 'Par défaut'), icon: Shield },
    { key: 'public', label: t('categorySelector.public', 'Publiques'), icon: Globe },
    { key: 'mine', label: t('categorySelector.mine', 'Mes catégories'), icon: User },
  ];

  const shouldGroup = filteredCategories.length > 8 && grouped.length > 1;

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {t('form.categories')} *
        </label>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {selectedIds.length} {t('categorySelector.selected', 'sélectionnée(s)')}
        </span>
      </div>

      {/* Selected chips */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white transition hover:opacity-80"
              style={{ backgroundColor: cat.color }}
            >
              {cat.icon} {cat.name}
              <X className="h-3 w-3 ml-0.5" />
            </button>
          ))}
        </div>
      )}

      {/* Search + filter row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('categorySelector.searchPlaceholder', 'Rechercher une catégorie...')}
            className="h-8 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-8 pr-8 text-xs text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition ${
            sourceFilters.size > 0
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          {sourceFilters.size > 0 && <span>{sourceFilters.size}</span>}
        </button>
      </div>

      {/* Source filter chips */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {sourceFilterDefs.map(({ key, label, icon: Icon }) => {
            const active = sourceFilters.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSourceFilter(key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            );
          })}
          {sourceFilters.size > 0 && (
            <button
              type="button"
              onClick={() => setSourceFilters(new Set())}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] underline"
            >
              {t('categorySelector.clearFilters', 'Effacer')}
            </button>
          )}
        </div>
      )}

      {/* Category list */}
      <div className="max-h-64 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        {filteredCategories.length === 0 ? (
          <p className="p-4 text-center text-xs text-[var(--color-text-secondary)] italic">
            {searchQuery
              ? t('categorySelector.noResults', 'Aucune catégorie trouvée')
              : t('categorySelector.empty', 'Aucune catégorie disponible')}
          </p>
        ) : shouldGroup ? (
          // Grouped by type
          <div className="divide-y divide-[var(--color-border)]">
            {grouped.map(([key, { type, cats }]) => {
              const isCollapsed = collapsedTypes.has(key);
              const selectedCount = cats.filter((c) => selectedIds.includes(c.id)).length;

              return (
                <div key={key}>
                  {/* Type header */}
                  <button
                    type="button"
                    onClick={() => toggleCollapse(key)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-hover)] transition"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                    )}
                    {type ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)]">
                        <span>{type.icon}</span>
                        {type.name}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                        {t('categorySelector.noType', 'Sans type')}
                      </span>
                    )}
                    <span className="ml-auto text-[10px] text-[var(--color-text-secondary)]">
                      {selectedCount > 0 && (
                        <span className="mr-1.5 text-[var(--color-primary)] font-medium">{selectedCount} ✓</span>
                      )}
                      {cats.length}
                    </span>
                  </button>
                  {/* Categories in group */}
                  {!isCollapsed && (
                    <div className="flex flex-wrap gap-1.5 px-3 pb-2.5">
                      {cats.map((cat) => (
                        <CategoryChip
                          key={cat.id}
                          cat={cat}
                          isSelected={selectedIds.includes(cat.id)}
                          onClick={() => toggleCategory(cat.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Flat list (few categories)
          <div className="flex flex-wrap gap-1.5 p-3">
            {filteredCategories.map((cat) => (
              <CategoryChip
                key={cat.id}
                cat={cat}
                isSelected={selectedIds.includes(cat.id)}
                onClick={() => toggleCategory(cat.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Helper */}
      <p className="text-xs text-[var(--color-text-secondary)]">
        {t('form.selectCategories')}
      </p>
    </div>
  );
}

// --- Chip sub-component ---

function CategoryChip({
  cat,
  isSelected,
  onClick,
}: {
  cat: Category;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        isSelected
          ? 'text-white shadow-sm'
          : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
      }`}
      style={isSelected ? { backgroundColor: cat.color } : undefined}
      title={cat.description || undefined}
    >
      {cat.icon} {cat.name}
      {cat.isDefault && !isSelected && (
        <Shield className="h-2.5 w-2.5 opacity-40" />
      )}
      {cat.isPublic && !cat.isDefault && !isSelected && (
        <Globe className="h-2.5 w-2.5 opacity-40" />
      )}
    </button>
  );
}
