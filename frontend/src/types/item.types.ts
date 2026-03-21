// ──────────────────────────────────────────────
// Item Types
// ──────────────────────────────────────────────

export interface ExternalLink {
  provider: string;
  label: string;
  url: string;
}

export interface Item {
  id: number;
  name: string;
  description: string | null;
  notes?: string | null;
  primaryType: ItemPrimaryType | null;
  rating: number | null;
  purchasePrice: number | null;
  marketValue: number | null;
  dateObtained: string | null;
  searchState: 'looking' | 'owned' | null;
  barcode: string | null;
  categories: ItemCategory[];
  status: ItemStatus | null;
  grades: ItemGrade[];
  storageLocation: ItemStorageLocation | null;
  metadata: Record<string, ItemMetadataValue>;
  categoryMetadata: Record<string, ItemMetadataValue>;
  externalLinks: ExternalLink[];
  images: MediaItem[];
  videos: MediaItem[];
  audio: MediaItem[];
  documents: MediaItem[];
  owner?: { id: number; username: string; avatarUrl?: string | null } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ItemCompact {
  id: number;
  name: string;
  description: string | null;
  primaryType: { key: string; name: string; icon: string } | null;
  rating: number | null;
  marketValue: number | null;
  dateObtained: string | null;
  searchState: 'looking' | 'owned' | null;
  status: ItemStatus | null;
  categories: { id: number; name: string; icon: string; iconType?: 'emoji' | 'url' }[];
  thumbnailUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface ItemPrimaryType {
  id: number;
  key: string;
  name: string;
  icon: string;
}

export interface ItemCategory {
  id: number;
  name: string;
  icon: string;
  iconType?: 'emoji' | 'url';
  color?: string;
}

export interface ItemMetadataValue {
  fieldId: number;
  label: string;
  value: any;
  type?: string;
  icon: string | null;
}

export interface ItemStatus {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export interface ItemGrade {
  id: number;
  name: string;
}

export interface ItemStorageLocation {
  id: number;
  name: string;
  description: string | null;
}

// ──────────────────────────────────────────────
// Media Types
// ──────────────────────────────────────────────

export interface MediaItem {
  id: number;
  url: string;
  title: string | null;
  filename: string;
  mimeType: string;
  size: number;
  displayOrder: number;
  createdAt: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export type MediaType = 'images' | 'videos' | 'audio' | 'documents';

// ──────────────────────────────────────────────
// Create / Update Payloads
// ──────────────────────────────────────────────

export interface CreateItemPayload {
  name: string;
  description?: string;
  primaryTypeId: number;
  categoryIds: number[];
  notes?: string;
  rating?: number;
  purchasePrice?: number;
  marketValue?: number;
  dateObtained?: string;
  searchState?: 'looking' | 'owned';
  barcode?: string;
  statusId?: number;
  storageLocationId?: number;
  gradeIds?: number[];
  metadata?: Record<string, any>;
  categoryMetadata?: Record<string, any>;
  externalLinks?: ExternalLink[];
}

export interface UpdateItemPayload {
  name?: string;
  description?: string;
  categoryIds?: number[];
  notes?: string;
  rating?: number;
  purchasePrice?: number;
  marketValue?: number;
  dateObtained?: string;
  searchState?: 'looking' | 'owned';
  barcode?: string;
  statusId?: number;
  storageLocationId?: number;
  gradeIds?: number[];
  metadata?: Record<string, any>;
  categoryMetadata?: Record<string, any>;
  externalLinks?: ExternalLink[];
}

// ──────────────────────────────────────────────
// Query Params
// ──────────────────────────────────────────────

export interface ItemQueryParams {
  categoryId?: number;
  search?: string;
  minRating?: number;
  minValue?: number;
  maxValue?: number;
  dateFrom?: string;
  dateTo?: string;
  searchState?: 'looking' | 'owned';
  statusId?: number;
  primaryTypeId?: number;
  storageLocationId?: number;
  barcode?: string;
  gradeIds?: number[];
  sort?: 'name' | 'createdAt' | 'value' | 'rating' | 'purchasePrice' | 'dateObtained';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────

export interface ItemsResponse {
  success: boolean;
  data: {
    items: ItemCompact[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    aggregations: {
      totalValue: number;
      avgRating: number;
    };
  };
}

export interface ItemResponse {
  success: boolean;
  data: Item;
}

export interface CreateItemResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
  };
}

export interface CopyItemPayload {
  name?: string;
  copyMedia?: boolean;
}

export interface CopyItemResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
  };
}
