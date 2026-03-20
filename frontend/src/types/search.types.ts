// ──────────────────────────────────────────────
// Search Types
// ──────────────────────────────────────────────

export interface SearchResult {
  id: number;
  name: string;
  description: string | null;
  icon?: string;
  type: 'item' | 'category';
}

export interface SearchItemResult extends SearchResult {
  type: 'item';
  primaryType: { key: string; name: string; icon: string } | null;
  rating: number | null;
  marketValue: number | null;
  searchState: 'looking' | 'owned' | null;
  status: { id: number; name: string; color: string; icon: string } | null;
  categories: { id: number; name: string; icon: string }[];
  createdAt: string;
}

export interface SearchCategoryResult extends SearchResult {
  type: 'category';
  color: string;
  itemsCount: number;
}

export interface GlobalSearchParams {
  q: string;
  scope?: 'all' | 'items' | 'categories';
  page?: number;
  limit?: number;
}

export interface SuggestParams {
  q: string;
  limit?: number;
}

export interface GlobalSearchResponse {
  success: boolean;
  data: {
    query: string;
    scope: string;
    items: SearchItemResult[];
    categories: SearchCategoryResult[];
    itemsTotal: number;
    categoriesTotal: number;
    pagination: {
      page: number;
      limit: number;
    };
  };
}

export interface SuggestResponse {
  success: boolean;
  data: {
    items: { id: number; name: string; icon: string; type: 'item' }[];
    categories: { id: number; name: string; icon: string; type: 'category' }[];
    history: string[];
  };
}

export interface SearchHistoryResponse {
  success: boolean;
  data: string[];
}
