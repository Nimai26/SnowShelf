import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  X,
  Clock,
  Package,
  FolderOpen,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { searchService } from '../../services/search.service';
import type { SuggestResponse } from '../../types/search.types';

interface GlobalSearchBarProps {
  className?: string;
}

export default function GlobalSearchBar({ className = '' }: GlobalSearchBarProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) {
      // Show history when no query
      try {
        const res = await searchService.getHistory();
        setSuggestions({ items: [], categories: [], history: res.data });
      } catch {
        setSuggestions(null);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await searchService.getSuggestions({ q, limit: 6 });
      setSuggestions(res.data);
    } catch {
      setSuggestions(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen, fetchSuggestions]);

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleItemClick = (id: number) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/items/${id}`);
  };

  const handleCategoryClick = (id: number) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/categories/${id}`);
  };

  const handleHistoryClick = (term: string) => {
    setQuery(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setIsOpen(false);
  };

  const handleRemoveHistory = async (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await searchService.removeHistoryEntry(term);
    if (suggestions) {
      setSuggestions({
        ...suggestions,
        history: suggestions.history.filter((h) => h !== term),
      });
    }
  };

  const handleClearHistory = async () => {
    await searchService.clearHistory();
    setSuggestions(suggestions ? { ...suggestions, history: [] } : null);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const hasSuggestions =
    suggestions &&
    (suggestions.items.length > 0 ||
      suggestions.categories.length > 0 ||
      suggestions.history.length > 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder={t('search.placeholder', 'Rechercher...')}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-hover)] py-1.5 pl-9 pr-8 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-text-secondary)] border-t-transparent" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        )}
      </form>

      {/* Suggestions dropdown */}
      {isOpen && hasSuggestions && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[320px] rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg z-50 overflow-hidden">
          {/* History section */}
          {suggestions.history.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-hover)]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  {t('search.history', 'Historique')}
                </span>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-[10px] text-[var(--color-text-secondary)] hover:text-red-400 transition"
                >
                  {t('search.clearHistory', 'Effacer')}
                </button>
              </div>
              {suggestions.history.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleHistoryClick(term)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-hover)] transition group"
                >
                  <Clock className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                  <span className="flex-1 text-left truncate">{term}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveHistory(term, e)}
                    className="invisible group-hover:visible text-[var(--color-text-secondary)] hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* Items section */}
          {suggestions.items.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-[var(--color-hover)]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  {t('search.items', 'Items')}
                </span>
              </div>
              {suggestions.items.map((item) => (
                <button
                  key={`item-${item.id}`}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-hover)] transition"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1 text-left truncate">{item.name}</span>
                  <Package className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                </button>
              ))}
            </div>
          )}

          {/* Categories section */}
          {suggestions.categories.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-[var(--color-hover)]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  {t('search.categories', 'Catégories')}
                </span>
              </div>
              {suggestions.categories.map((cat) => (
                <button
                  key={`cat-${cat.id}`}
                  type="button"
                  onClick={() => handleCategoryClick(cat.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-hover)] transition"
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="flex-1 text-left truncate">{cat.name}</span>
                  <FolderOpen className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                </button>
              ))}
            </div>
          )}

          {/* View all results link */}
          {query.trim().length >= 2 && (
            <button
              type="button"
              onClick={handleSubmit as any}
              className="flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-hover)] transition border-t border-[var(--color-border)]"
            >
              {t('search.viewAll', 'Voir tous les résultats')}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
