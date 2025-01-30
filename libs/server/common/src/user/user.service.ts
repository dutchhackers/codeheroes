import { CollectionReference } from 'firebase-admin/firestore';
import { PaginatedResponse, PaginationParams } from '../core/interfaces/pagination.interface';
import { BaseFirestoreService } from '../core/services';
import { getCurrentTimeAsISO } from '../core/firebase';
import { userConverter } from './user.converter';
import { CreateUserInput, UpdateUserInput } from './user.dto';
import { User } from './user.model';

// const USER_DEFAULTS = {
//   level: 1,
//   xp: 0,
//   xpToNextLevel: 100,
// } as const;

export class UserService extends BaseFirestoreService<User> {
  protected collection: CollectionReference<User>;

  constructor() {
    super();
    this.collection = this.db.collection('users').withConverter(userConverter);
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

  async getUsers(params: PaginationParams = {}): Promise<PaginatedResponse<User>> {
    const limit = params.limit || 10;
    let query = this.collection.orderBy('createdAt', 'desc').limit(limit + 1);

    if (params.startAfterId) {
      const startAfterDoc = await this.collection.doc(params.startAfterId).get();
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

  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    const docRef = this.collection.doc(userId);
    const timestamps = this.updateTimestamps();
    
    await docRef.update({
      ...input,
      ...timestamps,
    });

    return this.getUser(userId);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const snapshot = await this.collection
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }
}
