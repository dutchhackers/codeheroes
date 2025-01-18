export interface PaginationParams {
  limit?: number;
  startAfterId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  lastId: string | null;
  hasMore: boolean;
}
