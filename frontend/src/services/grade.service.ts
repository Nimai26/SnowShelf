import apiClient from './api';

// ──────────────────────────────────────────────
// Grade Types
// ──────────────────────────────────────────────

export interface Grade {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  categories?: { id: number; name: string }[];
  createdAt: string;
}

export interface CreateGradePayload {
  name: string;
  description?: string;
  categoryIds?: number[];
}

export interface UpdateGradePayload {
  name?: string;
  description?: string;
  categoryIds?: number[];
}

// ──────────────────────────────────────────────
// Grade API
// ──────────────────────────────────────────────

export const gradeService = {
  getAll: async (): Promise<{ success: boolean; data: Grade[] }> => {
    const response = await apiClient.get('/api/v1/grades');
    return response.data;
  },

  getByCategories: async (categoryIds: number[]): Promise<{ success: boolean; data: Grade[] }> => {
    const response = await apiClient.get('/api/v1/grades/by-categories', {
      params: { categoryIds: categoryIds.join(',') },
    });
    return response.data;
  },

  getById: async (id: number): Promise<{ success: boolean; data: Grade }> => {
    const response = await apiClient.get(`/api/v1/grades/${id}`);
    return response.data;
  },

  create: async (data: CreateGradePayload): Promise<{ success: boolean; data: Grade }> => {
    const response = await apiClient.post('/api/v1/grades', data);
    return response.data;
  },

  update: async (id: number, data: UpdateGradePayload): Promise<{ success: boolean; data: Grade }> => {
    const response = await apiClient.put(`/api/v1/grades/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/grades/${id}`);
    return response.data;
  },
};
