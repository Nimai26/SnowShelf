import apiClient from './api';

// ──────────────────────────────────────────────
// Status Types
// ──────────────────────────────────────────────

export interface Status {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  ordre: number;
  isSystem: boolean;
  createdAt: string;
}

export interface CreateStatusPayload {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  ordre?: number;
}

export interface UpdateStatusPayload {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  ordre?: number;
}

// ──────────────────────────────────────────────
// Status API
// ──────────────────────────────────────────────

export const statusService = {
  getAll: async (): Promise<{ success: boolean; data: Status[] }> => {
    const response = await apiClient.get('/api/v1/statuses');
    return response.data;
  },

  getById: async (id: number): Promise<{ success: boolean; data: Status }> => {
    const response = await apiClient.get(`/api/v1/statuses/${id}`);
    return response.data;
  },

  create: async (data: CreateStatusPayload): Promise<{ success: boolean; data: Status }> => {
    const response = await apiClient.post('/api/v1/statuses', data);
    return response.data;
  },

  update: async (id: number, data: UpdateStatusPayload): Promise<{ success: boolean; data: Status }> => {
    const response = await apiClient.put(`/api/v1/statuses/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/statuses/${id}`);
    return response.data;
  },
};
