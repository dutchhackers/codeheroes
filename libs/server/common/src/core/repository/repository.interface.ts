import { WhereFilterOp, OrderByDirection } from 'firebase-admin/firestore';

/** Base repository interface for standard CRUD operations */
export interface IRepository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  findAll(limit?: number): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, id?: string): Promise<T>;
  update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  delete(id: string): Promise<void>;
}

/** Query options for paginated results */
export interface QueryOptions {
  limit?: number;
  startAfterId?: string;
  orderBy?: string;
  direction?: OrderByDirection;
}

/** Result interface for paginated queries */
export interface PaginatedResult<T> {
  items: T[];
  lastId: string | null;
  hasMore: boolean;
}

/** Extended repository interface with advanced query capabilities */
export interface IAdvancedRepository<T extends { id: string }> extends IRepository<T> {
  findWhere(field: string, operator: WhereFilterOp, value: any, limit?: number): Promise<T[]>;
  findPaginated(options: QueryOptions): Promise<PaginatedResult<T>>;
  count(field?: string, operator?: WhereFilterOp, value?: any): Promise<number>;
}

/** Transaction function type */
export type TransactionFunction<R> = (transaction: FirebaseFirestore.Transaction) => Promise<R>;

/** Repository with transaction support */
export interface ITransactionalRepository {
  executeTransaction<R>(transactionFn: TransactionFunction<R>): Promise<R>;
}
