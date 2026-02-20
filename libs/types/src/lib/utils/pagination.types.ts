export interface PaginationParams {
  limit?: number;
  startAfterId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  userType?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  lastId: string | null;
  hasMore: boolean;
}

// Not in use, yet
export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
