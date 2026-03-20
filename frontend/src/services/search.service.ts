import apiClient from './api';
import type {
  GlobalSearchParams,
  GlobalSearchResponse,
  SuggestParams,
  SuggestResponse,
  SearchHistoryResponse,
} from '../types/search.types';

export const searchService = {
  globalSearch: async (params: GlobalSearchParams): Promise<GlobalSearchResponse> => {
    const response = await apiClient.get('/api/v1/search', { params });
    return response.data;
  },

  getSuggestions: async (params: SuggestParams): Promise<SuggestResponse> => {
    const response = await apiClient.get('/api/v1/search/suggestions', { params });
    return response.data;
  },

  getHistory: async (): Promise<SearchHistoryResponse> => {
    const response = await apiClient.get('/api/v1/search/history');
    return response.data;
  },

  clearHistory: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete('/api/v1/search/history');
    return response.data;
  },

  removeHistoryEntry: async (q: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete('/api/v1/search/history/entry', { params: { q } });
    return response.data;
  },
};
