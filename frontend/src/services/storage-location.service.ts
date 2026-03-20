import apiClient from './api';

// ──────────────────────────────────────────────
// StorageLocation Types
// ──────────────────────────────────────────────

export interface StorageLocation {
  id: number;
  name: string;
  description: string | null;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStorageLocationPayload {
  name: string;
  description?: string;
}

export interface UpdateStorageLocationPayload {
  name?: string;
  description?: string;
}

// ──────────────────────────────────────────────
// StorageLocation API
// ──────────────────────────────────────────────

export const storageLocationService = {
  getAll: async (): Promise<{ success: boolean; data: StorageLocation[] }> => {
    const response = await apiClient.get('/api/v1/storage-locations');
    return response.data;
  },

  getById: async (id: number): Promise<{ success: boolean; data: StorageLocation }> => {
    const response = await apiClient.get(`/api/v1/storage-locations/${id}`);
    return response.data;
  },

  create: async (data: CreateStorageLocationPayload): Promise<{ success: boolean; data: StorageLocation }> => {
    const response = await apiClient.post('/api/v1/storage-locations', data);
    return response.data;
  },

  update: async (id: number, data: UpdateStorageLocationPayload): Promise<{ success: boolean; data: StorageLocation }> => {
    const response = await apiClient.put(`/api/v1/storage-locations/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/v1/storage-locations/${id}`);
    return response.data;
  },
};
