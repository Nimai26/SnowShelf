import { create } from 'zustand';
import { User } from '../types/auth.types';
import { authService } from '../services/auth.service';
import { applyTheme } from '../theme/applyTheme';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, lang?: string) => Promise<string>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  isInitializing: !!localStorage.getItem('accessToken'),
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Sync server theme to browser
      if (user.theme) applyTheme(user.theme);

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur de connexion';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (username: string, email: string, password: string, lang?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register({ username, email, password, lang });
      set({ isLoading: false });
      return response.message;
    } catch (error: any) {
      const message = error.response?.data?.message || "Erreur d'inscription";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignorer les erreurs de logout
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false });
    }
  },

  fetchProfile: async () => {
    try {
      const response = await authService.getProfile();
      if (response.data.theme) applyTheme(response.data.theme);
      set({ user: response.data, isAuthenticated: true });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false });
    }
  },

  initializeAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isInitializing: false, isAuthenticated: false });
      return;
    }
    try {
      const response = await authService.getProfile();
      if (response.data.theme) applyTheme(response.data.theme);
      set({ user: response.data, isAuthenticated: true, isInitializing: false });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, isInitializing: false });
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user: User) => set({ user }),
}));
