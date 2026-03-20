import api from './api';
import type { ApiResponse } from '../types/auth.types';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  isPremium: boolean;
  isAdmin: boolean;
  avatarUrl: string | null;
  backgroundUrl: string | null;
  bio: string | null;
  theme: string;
  lang: string;
  newsletter: boolean;
  collectionsVisibility: string;
  friendRequestPolicy: string;
  showEmail: boolean;
  itemsCount: number;
  categoriesCount: number;
  totalValue: number | null;
  createdAt: string;
}

export interface UpdateProfileData {
  theme?: string;
  lang?: string;
  newsletter?: boolean;
  bio?: string;
  collectionsVisibility?: string;
  friendRequestPolicy?: string;
  showEmail?: boolean;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
  readAt: string | null;
}

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await api.get<ApiResponse<UserProfile>>('/api/v1/users/me');
    return data.data!;
  },

  updateProfile: async (profileData: UpdateProfileData): Promise<UserProfile> => {
    const { data } = await api.put<ApiResponse<UserProfile>>('/api/v1/users/me', profileData);
    return data.data!;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await api.put('/api/v1/users/me/password', {
      currentPassword,
      newPassword,
    });
    return data;
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post<ApiResponse<{ avatarUrl: string }>>('/api/v1/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data!;
  },

  // Notifications
  getNotifications: async (page = 1, limit = 20): Promise<Notification[]> => {
    const { data } = await api.get(`/api/v1/notifications?page=${page}&limit=${limit}`);
    return data.data ?? data ?? [];
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<ApiResponse<{ count: number }>>('/api/v1/notifications/unread-count');
    return data.data!.count;
  },

  markNotificationRead: async (id: number) => {
    const { data } = await api.put(`/api/v1/notifications/${id}/read`);
    return data;
  },

  markAllNotificationsRead: async () => {
    const { data } = await api.put('/api/v1/notifications/read-all');
    return data;
  },

  deleteNotification: async (id: number) => {
    const { data } = await api.delete(`/api/v1/notifications/${id}`);
    return data;
  },
};
