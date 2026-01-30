import {
  Firestore,
  CollectionReference,
  DocumentReference,
  DocumentData,
  Query,
  WhereFilterOp,
  OrderByDirection,
  FieldValue,
} from 'firebase-admin/firestore';
import {
  IAdvancedRepository,
  ITransactionalRepository,
  PaginatedResult,
  QueryOptions,
  TransactionFunction,
} from './repository.interface';
import { getCurrentTimeAsISO } from '../firebase/time.utils';
import { logger } from '../firebase/logger.util';

export abstract class BaseRepository<T extends { id: string }>
  implements IAdvancedRepository<T>, ITransactionalRepository
{
  /**
   * Path to the collection this repository manages
   * Must be implemented by concrete repositories
   */
  protected abstract collectionPath: string;

  /**
   * Path to the parent collection if this is a subcollection
   * E.g., 'users/{userId}/activities'
   */
  protected parentPath?: string;

  /**
   * Convert Firestore data to domain model
   * Default implementation returns data as-is
   */
  protected fromFirestore(data: DocumentData): T {
    return data as T;
  }

  /**
   * Convert domain model to Firestore data
   * Default implementation returns data as-is, removing createdAt/updatedAt
   */
  protected toFirestore(data: Partial<T>): DocumentData {
    // Strip any properties we don't want to save directly
    const { createdAt, updatedAt, ...rest } = data as any;
    return rest;
  }

  constructor(protected readonly db: Firestore) {}

  /**
   * Get reference to the collection
   * Handles both root collections and subcollections
   */
  protected getCollectionRef(parentId?: string): CollectionReference {
    if (this.parentPath && !parentId) {
      throw new Error(`Parent ID required for subcollection ${this.collectionPath}`);
    }

    if (this.parentPath && parentId) {
      const path = this.parentPath.replace('{parentId}', parentId) + '/' + this.collectionPath;
      return this.db.collection(path);
    }

    return this.db.collection(this.collectionPath);
  }

  /**
   * Get document reference
   */
  protected getDocRef(id: string, parentId?: string): DocumentReference {
    return this.getCollectionRef(parentId).doc(id);
  }

  /**
   * Find a document by ID
   */
  async findById(id: string, parentId?: string): Promise<T | null> {
    try {
      const docRef = this.getDocRef(id, parentId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...this.fromFirestore(doc.data() || {}),
      } as T;
    } catch (error) {
      logger.error(`Error finding document by ID in ${this.collectionPath}`, { id, error });
      throw error;
    }
  }

  /**
   * Find all documents in the collection
   */
  async findAll(limit = 100, parentId?: string): Promise<T[]> {
    try {
      const collectionRef = this.getCollectionRef(parentId);
      const snapshot = await collectionRef.limit(limit).get();

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...this.fromFirestore(doc.data()),
          }) as T,
      );
    } catch (error) {
      logger.error(`Error finding all documents in ${this.collectionPath}`, { error });
      throw error;
    }
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, id?: string, parentId?: string): Promise<T> {
    try {
      const collectionRef = this.getCollectionRef(parentId);
      const docRef = id ? collectionRef.doc(id) : collectionRef.doc();
      const now = getCurrentTimeAsISO();

      const newData = {
        ...this.toFirestore(data as Partial<T>),
        createdAt: now,
        updatedAt: now,
      };

      await docRef.set(newData);

      return {
        id: docRef.id,
        ...this.fromFirestore(newData),
        createdAt: now,
        updatedAt: now,
      } as T;
    } catch (error) {
      logger.error(`Error creating document in ${this.collectionPath}`, { error });
      throw error;
    }
  }

  /**
   * Update an existing document
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>, parentId?: string): Promise<void> {
    try {
      const docRef = this.getDocRef(id, parentId);
      const updateData = {
        ...this.toFirestore(data as Partial<T>),
        updatedAt: getCurrentTimeAsISO(),
      };

      await docRef.update(updateData);
    } catch (error) {
      logger.error(`Error updating document in ${this.collectionPath}`, { id, error });
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string, parentId?: string): Promise<void> {
    try {
      const docRef = this.getDocRef(id, parentId);
      await docRef.delete();
    } catch (error) {
      logger.error(`Error deleting document in ${this.collectionPath}`, { id, error });
      throw error;
    }
  }

  /**
   * Find documents matching a where clause
   */
  async findWhere(field: string, operator: WhereFilterOp, value: any, limit?: number, parentId?: string): Promise<T[]> {
    try {
      let query = this.getCollectionRef(parentId).where(field, operator, value);

      if (limit) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...this.fromFirestore(doc.data()),
          }) as T,
      );
    } catch (error) {
      logger.error(`Error finding documents with query in ${this.collectionPath}`, {
        field,
        operator,
        value,
        error,
      });
      throw error;
    }
  }

  /**
   * Get paginated results with consistent ordering
   */
  async findPaginated(options: QueryOptions = {}, parentId?: string): Promise<PaginatedResult<T>> {
    try {
      const { limit = 20, startAfterId, orderBy = 'createdAt', direction = 'desc' } = options;

      let query = this.getCollectionRef(parentId).orderBy(orderBy, direction);

      // If we have a starting point, use it
      if (startAfterId) {
        const startDoc = await this.getDocRef(startAfterId, parentId).get();
        if (startDoc.exists) {
          query = query.startAfter(startDoc);
        }
      }

      // Get one more than requested to determine if there are more results
      query = query.limit(limit + 1);

      const snapshot = await query.get();
      const items = snapshot.docs.slice(0, limit).map(
        (doc) =>
          ({
            id: doc.id,
            ...this.fromFirestore(doc.data()),
          }) as T,
      );

      const hasMore = snapshot.docs.length > limit;
      const lastId = items.length > 0 ? items[items.length - 1].id : null;

      return { items, lastId, hasMore };
    } catch (error) {
      logger.error(`Error finding paginated documents in ${this.collectionPath}`, {
        options,
        error,
      });
      throw error;
    }
  }

  /**
   * Count documents in collection, optionally with a filter
   */
  async count(field?: string, operator?: WhereFilterOp, value?: any, parentId?: string): Promise<number> {
    try {
      let query: Query = this.getCollectionRef(parentId);

      if (field && operator && value !== undefined) {
        query = query.where(field, operator, value);
      }

      const snapshot = await query.count().get();
      return snapshot.data().count;
    } catch (error) {
      logger.error(`Error counting documents in ${this.collectionPath}`, { error });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async executeTransaction<R>(transactionFn: TransactionFunction<R>): Promise<R> {
    try {
      return await this.db.runTransaction(transactionFn);
    } catch (error) {
      logger.error(`Error executing transaction in ${this.collectionPath}`, { error });
      throw error;
    }
  }

  /**
   * Create a batch operation
   */
  async createBatch(items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>, parentId?: string): Promise<T[]> {
    try {
      const batch = this.db.batch();
      const newItems: T[] = [];
      const now = getCurrentTimeAsISO();
      const collectionRef = this.getCollectionRef(parentId);

      for (const item of items) {
        const docRef = collectionRef.doc();
        const newData = {
          ...this.toFirestore(item as Partial<T>),
          createdAt: now,
          updatedAt: now,
        };

        batch.set(docRef, newData);

        newItems.push({
          id: docRef.id,
          ...this.fromFirestore(newData),
          createdAt: now,
          updatedAt: now,
        } as T);
      }

      await batch.commit();
      return newItems;
    } catch (error) {
      logger.error(`Error creating batch in ${this.collectionPath}`, { error });
      throw error;
    }
  }
}
