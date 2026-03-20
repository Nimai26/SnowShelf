// ──────────────────────────────────────────────
// Category Types
// ──────────────────────────────────────────────

export interface GradeSummary {
  id: number;
  name: string;
  description: string | null;
}

export interface ItemSummary {
  id: number;
  name: string;
}

export interface MediaCounts {
  images: number;
  videos: number;
  audio: number;
  documents: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  notes?: string | null;
  icon: string;
  iconType: 'emoji' | 'url';
  color: string;
  isDefault: boolean;
  isPublic: boolean;
  itemsCount: number;
  primaryTypeId: number | null;
  primaryType: {
    id: number;
    key: string;
    name: string;
    icon: string;
    color: string;
  } | null;
  defaultProviders: string[];
  owner: { id: number; username: string; avatarUrl?: string | null } | null;
  parentIds: number[];
  childIds: number[];
  parents?: CategorySummary[];
  children?: CategorySummary[];
  grades?: GradeSummary[];
  mediaCounts?: MediaCounts;
  recentItems?: ItemSummary[];
  createdAt: string;
  updatedAt?: string;
}

export interface CategorySummary {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface CreateCategoryPayload {
  name: string;
  primaryTypeId: number;
  description?: string;
  notes?: string;
  icon?: string;
  color?: string;
  defaultProviders?: string[];
  isPublic?: boolean;
  isDefault?: boolean;
  parentIds?: number[];
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  notes?: string;
  icon?: string;
  color?: string;
  defaultProviders?: string[];
  isPublic?: boolean;
  isDefault?: boolean;
  parentIds?: number[];
}

export interface CopyCategoryPayload {
  name?: string;
  copyMedia?: boolean;
}

export interface UpdateCategoryGradesPayload {
  gradeIds: number[];
}

export interface CategoryItemsQueryParams {
  sort?: 'name' | 'createdAt' | 'rating' | 'value';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CategoryQueryParams {
  filter?: 'all' | 'default' | 'public' | 'mine';
  search?: string;
  page?: number;
  limit?: number;
}

// ──────────────────────────────────────────────
// PrimaryType Types
// ──────────────────────────────────────────────

export interface PrimaryType {
  id: number;
  key: string;
  name: string;
  nameFr: string;
  nameEn: string;
  icon: string;
  color: string;
  sortOrder: number;
}

export interface PrimaryTypeField {
  id: number;
  key: string;
  name: string;
  nameFr?: string;
  nameEn?: string;
  type: 'text' | 'textarea' | 'number' | 'year' | 'date' | 'select' | 'multiselect' | 'url' | 'rating' | 'duration' | 'boolean' | 'checklist';
  options: string[] | null;
  placeholder?: string | null;
  helpText?: string | null;
  icon: string | null;
  isRequired: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  sortOrder: number;
}

export interface PrimaryTypeWithFields extends PrimaryType {
  fields: PrimaryTypeField[];
}

// CategoryField has the same shape as PrimaryTypeField
// but is scoped to a specific category (default categories only)
export type CategoryField = PrimaryTypeField & {
  categoryId: number;
};

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Category[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface CategoryResponse {
  success: boolean;
  data: Category;
}

export interface CreateCategoryResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    slug: string;
    isDefault?: boolean;
  };
}

export interface CopyCategoryResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface UpdateGradesResponse {
  success: boolean;
  message: string;
  data: {
    gradeIds: number[];
  };
}

export interface CategoryItemsResponse {
  success: boolean;
  data: {
    items: {
      id: number;
      name: string;
      slug: string;
      description: string | null;
      rating: number | null;
      marketValue: number | null;
      createdAt: string;
    }[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface PrimaryTypesResponse {
  success: boolean;
  data: PrimaryType[];
}

export interface PrimaryTypeResponse {
  success: boolean;
  data: PrimaryTypeWithFields;
}
