import apiClient from './api';
import type {
  CategoriesResponse,
  CategoryResponse,
  CreateCategoryPayload,
  CreateCategoryResponse,
  UpdateCategoryPayload,
  CopyCategoryPayload,
  CopyCategoryResponse,
  UpdateCategoryGradesPayload,
  UpdateGradesResponse,
  CategoryItemsResponse,
  CategoryItemsQueryParams,
  CategoryQueryParams,
  PrimaryTypesResponse,
  PrimaryTypeResponse,
  CategoryField,
} from '../types/category.types';

// ──────────────────────────────────────────────
// Categories API
// ──────────────────────────────────────────────

export const categoryService = {
  getCategories: async (
    params: CategoryQueryParams = {},
  ): Promise<CategoriesResponse> => {
    const response = await apiClient.get('/api/v1/categories', { params });
    return response.data;
  },

  getCategoryById: async (id: number): Promise<CategoryResponse> => {
    const response = await apiClient.get(`/api/v1/categories/${id}`);
    return response.data;
  },

  createCategory: async (
    data: CreateCategoryPayload,
  ): Promise<CreateCategoryResponse> => {
    const response = await apiClient.post('/api/v1/categories', data);
    return response.data;
  },

  updateCategory: async (
    id: number,
    data: UpdateCategoryPayload,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put(`/api/v1/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (
    id: number,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/categories/${id}`);
    return response.data;
  },

  uploadIcon: async (
    id: number,
    file: File,
  ): Promise<{ success: boolean; icon: string; iconType: 'emoji' | 'url' }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/api/v1/categories/${id}/icon`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  removeIcon: async (
    id: number,
  ): Promise<{ success: boolean; icon: string; iconType: 'emoji' | 'url' }> => {
    const response = await apiClient.delete(`/api/v1/categories/${id}/icon`);
    return response.data;
  },

  copyCategory: async (
    id: number,
    data: CopyCategoryPayload = {},
  ): Promise<CopyCategoryResponse> => {
    const response = await apiClient.post(`/api/v1/categories/${id}/copy`, data);
    return response.data;
  },

  updateCategoryGrades: async (
    id: number,
    data: UpdateCategoryGradesPayload,
  ): Promise<UpdateGradesResponse> => {
    const response = await apiClient.put(`/api/v1/categories/${id}/grades`, data);
    return response.data;
  },

  getCategoryItems: async (
    id: number,
    params: CategoryItemsQueryParams = {},
  ): Promise<CategoryItemsResponse> => {
    const response = await apiClient.get(`/api/v1/categories/${id}/items`, { params });
    return response.data;
  },

  importDefaults: async (): Promise<{
    success: boolean;
    message: string;
    data: { imported: number; skipped: number; total: number };
  }> => {
    const response = await apiClient.post('/api/v1/categories/import-defaults');
    return response.data;
  },

  getCategoryFields: async (
    categoryId: number,
  ): Promise<{ success: boolean; data: CategoryField[] }> => {
    const response = await apiClient.get(
      `/api/v1/categories/${categoryId}/fields`,
    );
    return response.data;
  },

  createCategoryField: async (
    categoryId: number,
    data: Record<string, any>,
  ): Promise<{ success: boolean; data: CategoryField }> => {
    const response = await apiClient.post(
      `/api/v1/categories/${categoryId}/fields`,
      data,
    );
    return response.data;
  },

  updateCategoryField: async (
    categoryId: number,
    fieldId: number,
    data: Record<string, any>,
  ): Promise<{ success: boolean; data: CategoryField }> => {
    const response = await apiClient.put(
      `/api/v1/categories/${categoryId}/fields/${fieldId}`,
      data,
    );
    return response.data;
  },

  deleteCategoryField: async (
    categoryId: number,
    fieldId: number,
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(
      `/api/v1/categories/${categoryId}/fields/${fieldId}`,
    );
    return response.data;
  },
};

// ──────────────────────────────────────────────
// PrimaryTypes API
// ──────────────────────────────────────────────

export const primaryTypeService = {
  getAll: async (lang?: string): Promise<PrimaryTypesResponse> => {
    const params = lang ? { lang } : {};
    const response = await apiClient.get('/api/v1/primary-types', { params });
    return response.data;
  },

  getById: async (
    id: number,
    lang?: string,
  ): Promise<PrimaryTypeResponse> => {
    const params = lang ? { lang } : {};
    const response = await apiClient.get(`/api/v1/primary-types/${id}`, {
      params,
    });
    return response.data;
  },

  getFieldsByKey: async (
    keyName: string,
    lang?: string,
  ): Promise<PrimaryTypeResponse> => {
    const params = lang ? { lang } : {};
    const response = await apiClient.get(
      `/api/v1/primary-types/key/${keyName}`,
      { params },
    );
    return response.data;
  },
};
