import apiClient from './api';
import { LoginCredentials, RegisterData, AuthResponse, RegisterResponse, ApiResponse } from '../types/auth.types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/v1/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await apiClient.post('/api/v1/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post('/api/v1/auth/logout');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/v1/auth/refresh', { refreshToken });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/api/v1/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/api/v1/auth/reset-password', { token, newPassword });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<ApiResponse> => {
    const response = await apiClient.get(`/api/v1/auth/verify-email?token=${token}`);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/api/v1/users/me');
    return response.data;
  },
};
