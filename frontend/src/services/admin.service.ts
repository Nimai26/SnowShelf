import apiClient from './api';
import type {
  DashboardStats,
  AdminUsersPaginated,
  RecentActivity,
  AdminField,
  FieldTypeOption,
  CreateFieldPayload,
  UpdateFieldPayload,
  AdminDomain,
  AdminProvider,
  AdminPrimaryType,
  CreatePrimaryTypePayload,
  UpdatePrimaryTypePayload,
  CreateDomainPayload,
  UpdateDomainPayload,
  CreateProviderPayload,
  UpdateProviderPayload,
  TakoApiConfig,
  UpdateTakoConfigPayload,
  Newsletter,
  NewslettersPaginated,
  PublishedNewsletter,
  NewsletterAudience,
} from '../types/admin.types';
import type { PrimaryType } from '../types/category.types';

export const adminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/api/v1/admin/dashboard');
    return data;
  },

  getRecentActivity: async (limit = 20): Promise<RecentActivity> => {
    const { data } = await apiClient.get('/api/v1/admin/activity', {
      params: { limit },
    });
    return data;
  },

  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sort?: string;
    order?: string;
  }): Promise<AdminUsersPaginated> => {
    const { data } = await apiClient.get('/api/v1/admin/users', { params });
    return data;
  },

  changeUserRole: async (
    userId: number,
    role: string,
  ): Promise<{ id: number; username: string; role: string }> => {
    const { data } = await apiClient.put(`/api/v1/admin/users/${userId}/role`, {
      role,
    });
    return data;
  },

  deleteUser: async (
    userId: number,
  ): Promise<{ deleted: boolean; username: string }> => {
    const { data } = await apiClient.delete(`/api/v1/admin/users/${userId}`);
    return data;
  },

  sendBroadcast: async (
    title: string,
    message: string,
  ): Promise<{ sent: number }> => {
    const { data } = await apiClient.post('/api/v1/admin/notifications/broadcast', {
      title,
      message,
    });
    return data;
  },

  // ──── Primary Types & Fields ────

  getPrimaryTypes: async (): Promise<PrimaryType[]> => {
    const { data } = await apiClient.get('/api/v1/primary-types');
    return data.data || data;
  },

  getFieldTypes: async (): Promise<FieldTypeOption[]> => {
    const { data } = await apiClient.get('/api/v1/primary-types/field-types');
    return data.data || data;
  },

  getFieldsForAdmin: async (primaryTypeId: number): Promise<AdminField[]> => {
    const { data } = await apiClient.get(`/api/v1/primary-types/${primaryTypeId}/admin-fields`);
    const payload = data.data || data;
    return payload.fields || payload;
  },

  getFieldForAdmin: async (fieldId: number): Promise<AdminField> => {
    const { data } = await apiClient.get(`/api/v1/primary-types/fields/${fieldId}/admin`);
    return data.data || data;
  },

  createField: async (payload: CreateFieldPayload): Promise<AdminField> => {
    const { data } = await apiClient.post('/api/v1/primary-types/fields', payload);
    return data.data || data;
  },

  updateField: async (fieldId: number, payload: UpdateFieldPayload): Promise<AdminField> => {
    const { data } = await apiClient.put(`/api/v1/primary-types/fields/${fieldId}`, payload);
    return data.data || data;
  },

  deleteField: async (fieldId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/primary-types/fields/${fieldId}`);
  },

  reorderFields: async (primaryTypeId: number, fields: { id: number; sortOrder: number }[]): Promise<void> => {
    await apiClient.put(`/api/v1/primary-types/${primaryTypeId}/reorder-fields`, { fields });
  },

  // ──── Admin Tako: Types, Domains, Providers ────

  getAdminTypes: async (): Promise<AdminPrimaryType[]> => {
    const { data } = await apiClient.get('/api/v1/admin/tako/types');
    return data.data || data;
  },

  createAdminType: async (payload: CreatePrimaryTypePayload): Promise<AdminPrimaryType> => {
    const { data } = await apiClient.post('/api/v1/admin/tako/types', payload);
    return data.data || data;
  },

  updateAdminType: async (id: number, payload: UpdatePrimaryTypePayload): Promise<AdminPrimaryType> => {
    const { data } = await apiClient.put(`/api/v1/admin/tako/types/${id}`, payload);
    return data.data || data;
  },

  deleteAdminType: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/tako/types/${id}`);
  },

  getAdminDomains: async (): Promise<AdminDomain[]> => {
    const { data } = await apiClient.get('/api/v1/admin/tako/domains');
    return data.data || data;
  },

  createAdminDomain: async (payload: CreateDomainPayload): Promise<AdminDomain> => {
    const { data } = await apiClient.post('/api/v1/admin/tako/domains', payload);
    return data.data || data;
  },

  updateAdminDomain: async (id: number, payload: UpdateDomainPayload): Promise<AdminDomain> => {
    const { data } = await apiClient.put(`/api/v1/admin/tako/domains/${id}`, payload);
    return data.data || data;
  },

  deleteAdminDomain: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/tako/domains/${id}`);
  },

  createAdminProvider: async (payload: CreateProviderPayload): Promise<AdminProvider> => {
    const { data } = await apiClient.post('/api/v1/admin/tako/providers', payload);
    return data.data || data;
  },

  updateAdminProvider: async (id: number, payload: UpdateProviderPayload): Promise<AdminProvider> => {
    const { data } = await apiClient.put(`/api/v1/admin/tako/providers/${id}`, payload);
    return data.data || data;
  },

  deleteAdminProvider: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/tako/providers/${id}`);
  },

  toggleAdminProvider: async (id: number): Promise<{ id: number; isActive: boolean }> => {
    const { data } = await apiClient.patch(`/api/v1/admin/tako/providers/${id}/toggle`);
    return data.data || data;
  },

  // ──── Admin Tako: API Config ────

  getTakoConfig: async (): Promise<TakoApiConfig> => {
    const { data } = await apiClient.get('/api/v1/admin/tako/config');
    return data.data || data;
  },

  updateTakoConfig: async (payload: UpdateTakoConfigPayload): Promise<TakoApiConfig> => {
    const { data } = await apiClient.put('/api/v1/admin/tako/config', payload);
    return data.data || data;
  },

  triggerTakoHealthCheck: async (): Promise<{ status: string; version?: string; uptime?: number }> => {
    const { data } = await apiClient.post('/api/v1/admin/tako/config/health-check');
    return data.data || data;
  },

  // ──── Newsletters ────

  getNewsletters: async (page = 1, limit = 20): Promise<NewslettersPaginated> => {
    const { data } = await apiClient.get('/api/v1/admin/newsletters', { params: { page, limit } });
    return data;
  },

  getNewsletter: async (id: number): Promise<Newsletter> => {
    const { data } = await apiClient.get(`/api/v1/admin/newsletters/${id}`);
    return data;
  },

  createNewsletter: async (title: string, content: string, targetAudience?: NewsletterAudience): Promise<{ id: number; title: string; status: string }> => {
    const { data } = await apiClient.post('/api/v1/admin/newsletters', { title, content, targetAudience });
    return data;
  },

  updateNewsletter: async (id: number, title?: string, content?: string, targetAudience?: NewsletterAudience): Promise<{ id: number; title: string; status: string }> => {
    const { data } = await apiClient.put(`/api/v1/admin/newsletters/${id}`, { title, content, targetAudience });
    return data;
  },

  deleteNewsletter: async (id: number): Promise<{ deleted: boolean }> => {
    const { data } = await apiClient.delete(`/api/v1/admin/newsletters/${id}`);
    return data;
  },

  publishNewsletter: async (id: number, sendNotification: boolean, sendEmail: boolean): Promise<{ id: number; status: string; notifCount: number; emailCount: number }> => {
    const { data } = await apiClient.post(`/api/v1/admin/newsletters/${id}/publish`, { sendNotification, sendEmail });
    return data;
  },

  getPublishedNewsletters: async (page = 1, limit = 10): Promise<{ newsletters: PublishedNewsletter[]; pagination: any }> => {
    const { data } = await apiClient.get('/api/v1/newsletters', { params: { page, limit } });
    return data;
  },
};
