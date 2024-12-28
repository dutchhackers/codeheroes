import { CollectionReference, getFirestore } from 'firebase-admin/firestore';
import { userConverter } from '../converters';
import {
  CreateUserInput,
  PaginatedResponse,
  PaginationParams,
} from '../interfaces/user.interface';
import { User } from '../models';
import { getCurrentTimeAsISO } from '../utils';
import { BaseFirestoreService } from './base.service';

// const USER_DEFAULTS = {
//   level: 1,
//   xp: 0,
//   xpToNextLevel: 100,
// } as const;

export class UserService extends BaseFirestoreService<User> {
  protected collection: CollectionReference<User>;

  constructor() {
    super();
    this.collection = getFirestore()
      .collection('users')
      .withConverter(userConverter);
  }

  // async createUser(input: CreateUserInput): Promise<User> {
  //   return this.create({
  //     email: input.email,
  //     displayName: input.displayName || '',
  //     photoUrl: input.photoUrl || '',
  //     active: true,
  //     level: 1,
  //     xp: 0,
  //     xpToNextLevel: 100
  //   });
  // }

  async createUser(input: CreateUserInput) {
    if (!input) {
      throw new Error('User data is required');
    }

    const docRef = this.collection.doc(); // Generates new ID
    const timestamps = this.createTimestamps();

    const userDoc: User = {
      id: docRef.id,
      active: true,
      lastLogin: getCurrentTimeAsISO(),
      ...input,
      ...timestamps,
    };
    await docRef.set(userDoc);
    return this.getUser(docRef.id);
  }

  async getUser(userId: string): Promise<User> {
    const snapshot = await this.collection.doc(userId).get();
    return snapshot.data();
  }

  async getUsers(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<User>> {
    const limit = params.limit || 10;
    let query = this.collection.orderBy('createdAt', 'desc').limit(limit + 1);

    if (params.startAfterId) {
      const startAfterDoc = await this.collection
        .doc(params.startAfterId)
        .get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    const items = snapshot.docs.slice(0, limit).map((doc) => doc.data());
    const hasMore = snapshot.docs.length > limit;
    const lastId = items.length > 0 ? items[items.length - 1].id : null;

    return {
      items,
      lastId,
      hasMore,
    };
  }
}
