import apiClient from './api';
import type {
  ItemsResponse,
  ItemResponse,
  CreateItemPayload,
  CreateItemResponse,
  UpdateItemPayload,
  ItemQueryParams,
  CopyItemPayload,
  CopyItemResponse,
} from '../types/item.types';

export const itemService = {
  getItems: async (
    params: ItemQueryParams = {},
  ): Promise<ItemsResponse> => {
    const response = await apiClient.get('/api/v1/items', { params });
    return response.data;
  },

  getItemById: async (id: number, lang?: string): Promise<ItemResponse> => {
    const params = lang ? { lang } : {};
    const response = await apiClient.get(`/api/v1/items/${id}`, { params });
    return response.data;
  },

  createItem: async (data: CreateItemPayload): Promise<CreateItemResponse> => {
    const response = await apiClient.post('/api/v1/items', data);
    return response.data;
  },

  updateItem: async (
    id: number,
    data: UpdateItemPayload,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put(`/api/v1/items/${id}`, data);
    return response.data;
  },

  deleteItem: async (
    id: number,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/items/${id}`);
    return response.data;
  },

  copyItem: async (
    id: number,
    data: CopyItemPayload = {},
  ): Promise<CopyItemResponse> => {
    const response = await apiClient.post(`/api/v1/items/${id}/copy`, data);
    return response.data;
  },

  /**
   * Vérifie si un item similaire existe déjà (par barcode ou nom)
   */
  checkDuplicate: async (
    barcode?: string,
    name?: string,
  ): Promise<{
    success: boolean;
    data: {
      isDuplicate: boolean;
      existingItems: { id: number; name: string; barcode: string | null; primaryTypeName: string; createdAt: string }[];
    };
  }> => {
    const params: Record<string, string> = {};
    if (barcode) params.barcode = barcode;
    if (name) params.name = name;
    const response = await apiClient.get('/api/v1/items/check-duplicate', { params });
    return response.data;
  },
};
