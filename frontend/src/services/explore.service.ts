import api from './api';
import type { ItemCompact, Item, ItemQueryParams } from '../types/item.types';

// ── Types ──────────────────────────────────────

export interface PublicUser {
  id: number;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  itemsCount: number;
  categoriesCount: number;
  createdAt: string;
}

export interface PublicProfile {
  id: number;
  username: string;
  avatarUrl: string | null;
  backgroundUrl: string | null;
  bio: string | null;
  email: string | null;
  itemsCount: number;
  categoriesCount: number;
  collectionsVisibility: string;
  friendRequestPolicy: string;
  isOwner: boolean;
  createdAt: string;
}

export interface PublicCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  iconType: string;
  color: string;
  itemsCount: number;
  primaryType: {
    id: number;
    key: string;
    name: string;
    icon: string;
    color: string;
  } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ── Service ──────────────────────────────────────

export const exploreService = {
  getPublicUsers: async (
    search?: string,
    page = 1,
    limit = 20,
  ): Promise<{ users: PublicUser[]; pagination: Pagination }> => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const { data } = await api.get(`/api/v1/users/explore?${params}`);
    return data.data;
  },

  getPublicProfile: async (username: string): Promise<PublicProfile> => {
    const { data } = await api.get(`/api/v1/users/${encodeURIComponent(username)}`);
    return data.data;
  },

  getPublicCategories: async (
    username: string,
    page = 1,
    limit = 50,
    search?: string,
  ): Promise<{ categories: PublicCategory[]; pagination: Pagination }> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);
    const { data } = await api.get(
      `/api/v1/users/${encodeURIComponent(username)}/categories?${params}`,
    );
    return data.data;
  },

  getPublicItems: async (
    username: string,
    queryParams: ItemQueryParams,
  ): Promise<{
    items: ItemCompact[];
    pagination: Pagination;
    aggregations: { totalValue: number; avgRating: number };
  }> => {
    const params = new URLSearchParams();
    params.set('page', String(queryParams.page || 1));
    params.set('limit', String(queryParams.limit || 24));
    if (queryParams.search) params.set('search', queryParams.search);
    if (queryParams.sort) params.set('sort', queryParams.sort);
    if (queryParams.order) params.set('order', queryParams.order);
    if (queryParams.categoryId) params.set('categoryId', String(queryParams.categoryId));
    if (queryParams.searchState) params.set('searchState', queryParams.searchState);
    if (queryParams.statusId) params.set('statusId', String(queryParams.statusId));
    if (queryParams.primaryTypeId) params.set('primaryTypeId', String(queryParams.primaryTypeId));
    if (queryParams.minRating) params.set('minRating', String(queryParams.minRating));
    if (queryParams.minValue != null) params.set('minValue', String(queryParams.minValue));
    if (queryParams.maxValue != null) params.set('maxValue', String(queryParams.maxValue));
    if (queryParams.dateFrom) params.set('dateFrom', queryParams.dateFrom);
    if (queryParams.dateTo) params.set('dateTo', queryParams.dateTo);
    const { data } = await api.get(
      `/api/v1/users/${encodeURIComponent(username)}/items?${params}`,
    );
    return data.data;
  },

  getPublicItemDetail: async (
    username: string,
    itemId: number,
  ): Promise<Item> => {
    const { data } = await api.get(
      `/api/v1/users/${encodeURIComponent(username)}/items/${itemId}`,
    );
    return data.data;
  },

  getPublicCategoryItems: async (
    username: string,
    categoryId: number,
    page = 1,
    limit = 50,
    sort = 'createdAt',
    order = 'desc',
    search?: string,
  ): Promise<{
    category: { id: number; name: string; icon: string; color: string };
    items: ItemCompact[];
    pagination: Pagination;
  }> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    params.set('sort', sort);
    params.set('order', order);
    if (search) params.set('search', search);
    const { data } = await api.get(
      `/api/v1/users/${encodeURIComponent(username)}/categories/${categoryId}/items?${params}`,
    );
    return data.data;
  },
};
