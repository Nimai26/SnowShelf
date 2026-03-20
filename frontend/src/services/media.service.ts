import apiClient from './api';
import type { MediaItem, MediaType } from '../types/item.types';

// ──────────────────────────────────────────────
// Item Media API
// ──────────────────────────────────────────────

export const itemMediaService = {
  getAll: async (itemId: number, mediaType: MediaType): Promise<MediaItem[]> => {
    const response = await apiClient.get(`/api/v1/items/${itemId}/media/${mediaType}`);
    return response.data;
  },

  upload: async (
    itemId: number,
    mediaType: MediaType,
    files: File[],
    titles?: string[],
  ): Promise<MediaItem[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (titles) {
      titles.forEach((title) => formData.append('titles', title));
    }
    const response = await apiClient.post(
      `/api/v1/items/${itemId}/media/${mediaType}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  update: async (
    itemId: number,
    mediaType: MediaType,
    mediaId: number,
    data: { title?: string; displayOrder?: number },
  ): Promise<MediaItem> => {
    const response = await apiClient.put(
      `/api/v1/items/${itemId}/media/${mediaType}/${mediaId}`,
      data,
    );
    return response.data;
  },

  reorder: async (
    itemId: number,
    mediaType: MediaType,
    order: number[],
  ): Promise<MediaItem[]> => {
    const response = await apiClient.put(
      `/api/v1/items/${itemId}/media/${mediaType}/reorder`,
      { order },
    );
    return response.data;
  },

  delete: async (
    itemId: number,
    mediaType: MediaType,
    mediaId: number,
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete(
      `/api/v1/items/${itemId}/media/${mediaType}/${mediaId}`,
    );
    return response.data;
  },

  /**
   * Attache un fichier temporaire (déjà sur le serveur) comme média d'un item.
   * Utilisé pour les images importées depuis Tako.
   */
  attachFromTemp: async (
    itemId: number,
    mediaType: MediaType,
    tempUrl: string,
    title?: string,
  ): Promise<MediaItem> => {
    const response = await apiClient.post(
      `/api/v1/items/${itemId}/media/${mediaType}/from-temp`,
      { tempUrl, title },
    );
    return response.data;
  },

  /**
   * Enregistre une URL externe (YouTube, Vimeo, etc.) comme média d'un item.
   * Pas de téléchargement, l'URL est stockée comme référence.
   */
  attachFromUrl: async (
    itemId: number,
    mediaType: MediaType,
    url: string,
    title?: string,
    thumbnailUrl?: string,
  ): Promise<MediaItem> => {
    const response = await apiClient.post(
      `/api/v1/items/${itemId}/media/${mediaType}/from-url`,
      { url, title, thumbnailUrl },
    );
    return response.data;
  },
};

// ──────────────────────────────────────────────
// Category Media API
// ──────────────────────────────────────────────

export const categoryMediaService = {
  getAll: async (categoryId: number, mediaType: MediaType): Promise<MediaItem[]> => {
    const response = await apiClient.get(`/api/v1/categories/${categoryId}/media/${mediaType}`);
    return response.data;
  },

  upload: async (
    categoryId: number,
    mediaType: MediaType,
    files: File[],
    titles?: string[],
  ): Promise<MediaItem[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (titles) {
      titles.forEach((title) => formData.append('titles', title));
    }
    const response = await apiClient.post(
      `/api/v1/categories/${categoryId}/media/${mediaType}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  update: async (
    categoryId: number,
    mediaType: MediaType,
    mediaId: number,
    data: { title?: string; displayOrder?: number },
  ): Promise<MediaItem> => {
    const response = await apiClient.put(
      `/api/v1/categories/${categoryId}/media/${mediaType}/${mediaId}`,
      data,
    );
    return response.data;
  },

  reorder: async (
    categoryId: number,
    mediaType: MediaType,
    order: number[],
  ): Promise<MediaItem[]> => {
    const response = await apiClient.put(
      `/api/v1/categories/${categoryId}/media/${mediaType}/reorder`,
      { order },
    );
    return response.data;
  },

  delete: async (
    categoryId: number,
    mediaType: MediaType,
    mediaId: number,
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete(
      `/api/v1/categories/${categoryId}/media/${mediaType}/${mediaId}`,
    );
    return response.data;
  },
};
