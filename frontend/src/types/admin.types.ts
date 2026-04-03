// ──────────────────────────────────────────────
// Admin Field Types
// ──────────────────────────────────────────────

export interface AdminField {
  id: number;
  primaryTypeId: number;
  fieldKey: string;
  fieldNameFr: string;
  fieldNameEn: string;
  fieldType: string;
  fieldOptions: string[] | null;
  placeholderFr: string | null;
  placeholderEn: string | null;
  helpTextFr: string | null;
  helpTextEn: string | null;
  icon: string | null;
  isRequired: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FieldTypeOption {
  value: string;
  label: string;
}

export interface CreateFieldPayload {
  primaryTypeId: number;
  fieldKey: string;
  fieldNameFr: string;
  fieldNameEn?: string;
  fieldType?: string;
  fieldOptions?: string[] | null;
  placeholderFr?: string;
  placeholderEn?: string;
  helpTextFr?: string;
  helpTextEn?: string;
  icon?: string;
  isRequired?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  sortOrder?: number;
}

export interface UpdateFieldPayload {
  fieldKey?: string;
  fieldNameFr?: string;
  fieldNameEn?: string;
  fieldType?: string;
  fieldOptions?: string[] | null;
  placeholderFr?: string;
  placeholderEn?: string;
  helpTextFr?: string;
  helpTextEn?: string;
  icon?: string;
  isRequired?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  sortOrder?: number;
}

// ──────────────────────────────────────────────
// Admin Tako Types (Domains / Providers / Types)
// ──────────────────────────────────────────────

export interface AdminDomain {
  id: number;
  name: string;
  displayName: string;
  icon: string | null;
  routePath: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  providers: AdminProvider[];
}

export interface AdminProvider {
  id: number;
  key: string;
  displayName: string;
  description: string | null;
  detailSegment: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminPrimaryType {
  id: number;
  keyName: string;
  nameFr: string;
  nameEn: string;
  icon: string;
  color: string;
  sortOrder: number;
  domainIds: number[];
  domains: { id: number; name: string; displayName: string; icon: string | null }[];
}

export interface CreatePrimaryTypePayload {
  keyName: string;
  nameFr: string;
  nameEn: string;
  icon: string;
  color?: string;
  sortOrder?: number;
  domainIds?: number[];
}

export interface UpdatePrimaryTypePayload {
  keyName?: string;
  nameFr?: string;
  nameEn?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  domainIds?: number[];
}

export interface CreateDomainPayload {
  name: string;
  displayName: string;
  icon?: string;
  routePath?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateDomainPayload {
  displayName?: string;
  icon?: string;
  routePath?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateProviderPayload {
  domainId: number;
  key: string;
  displayName: string;
  description?: string;
  detailSegment?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateProviderPayload {
  displayName?: string;
  description?: string;
  detailSegment?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// ──────────────────────────────────────────────
// Dashboard Types
// ──────────────────────────────────────────────

export interface DashboardStats {
  users: {
    total: number;
    free: number;
    premium: number;
    admin: number;
    newThisMonth: number;
  };
  items: {
    total: number;
    byType: { name: string; icon: string; count: number }[];
    totalValue: number;
  };
  categories: {
    total: number;
  };
  trends: {
    registrations: { date: string; count: number }[];
    items: { date: string; count: number }[];
  };
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  emailVerified: boolean;
  itemsCount: number;
  categoriesCount: number;
  totalValue: number;
  lastLoginAt: string | null;
  createdAt: string;
  avatarUrl: string | null;
}

export interface AdminUsersPaginated {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RecentActivity {
  recentItems: {
    id: number;
    name: string;
    createdAt: string;
    user: { id: number; username: string; avatarUrl: string | null };
  }[];
  recentUsers: {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
    createdAt: string;
  }[];
}

// ──────────────────────────────────────────────
// Tako API Config
// ──────────────────────────────────────────────

export interface TakoApiConfig {
  id: number;
  apiUrl: string;
  timeout: number;
  cacheTtl: number;
  maxRetries: number;
  isActive: boolean;
  lastHealthCheck: string | null;
  healthStatus: 'healthy' | 'degraded' | 'down';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTakoConfigPayload {
  apiUrl?: string;
  timeout?: number;
  cacheTtl?: number;
  maxRetries?: number;
  isActive?: boolean;
}

// ──────────────────────────────────────────────
// Newsletter Types
// ──────────────────────────────────────────────

export type NewsletterAudience = 'all' | 'free' | 'premium' | 'admin';

export interface Newsletter {
  id: number;
  title: string;
  content: string;
  status: 'draft' | 'published';
  targetAudience: NewsletterAudience;
  publishedAt: string | null;
  notificationSent: boolean;
  emailSent: boolean;
  author: { id: number; username: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewslettersPaginated {
  newsletters: Newsletter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PublishedNewsletter {
  id: number;
  title: string;
  content: string;
  publishedAt: string;
  author: { id: number; username: string } | null;
}
