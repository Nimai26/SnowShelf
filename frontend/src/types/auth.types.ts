export type UserRole = 'free' | 'premium' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  isPremium?: boolean;
  isAdmin?: boolean;
  avatarUrl?: string;
  backgroundUrl?: string;
  bio?: string;
  theme: string;
  lang: string;
  newsletter?: boolean;
  collectionsVisibility?: string;
  itemsCount: number;
  categoriesCount: number;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  lang?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    userId: number;
    email: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
