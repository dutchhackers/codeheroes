export interface CreateUserInput {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface PaginationParams {
  limit?: number;
  startAfterId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  lastId: string | null;
  hasMore: boolean;
}
