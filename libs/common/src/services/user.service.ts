import { getFirestore } from 'firebase-admin/firestore';
import { userConverter } from '../converters';
import { CreateUserInput } from '../interfaces/user.interface';
import { User } from '../models';
import { getCurrentTimeAsISO } from '../utils';

const USER_DEFAULTS = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  active: true,
} as const;

export class UserService {
  private db = getFirestore();
  private collection = this.db.collection('users').withConverter(userConverter);

  async createUser(input: CreateUserInput) {
    if (!input) {
      throw new Error('User data is required');
    }

    const docRef = this.collection.doc(); // Generates new ID
    const now = getCurrentTimeAsISO();
    const userDoc: User = {
      ...USER_DEFAULTS,
      email: input.email,
      photoUrl: input.photoURL || '',
      displayName: input.displayName || '',
      userId: '', // Empty string if this is required
      createdAt: now,
      lastLogin: now,
    };
    await docRef.set(userDoc);
    return this.getUser(docRef.id);
  }

  async getUser(userId: string): Promise<User> {
    const snapshot = await this.collection.doc(userId).get();
    return snapshot.data();
  }
}
