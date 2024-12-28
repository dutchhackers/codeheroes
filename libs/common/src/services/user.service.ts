import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { userConverter } from '../converters';
import { CreateUserInput } from '../interfaces/user.interface';
import { User } from '../models';

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
    const now = Timestamp.now().toDate().toISOString();
    const userDoc: User = {
      ...USER_DEFAULTS,
      email: input.email,
      photoUrl: input.photoURL || '',
      displayName: input.displayName || '',
      userId: '', // Empty string if this is required
      createdAt: now,
      lastLogin: now,
    };
    const response = await docRef.set(userDoc);
    console.log('User created', response);
    // await this.db.collection('users').withConverter(userConverter).doc().set(userDoc);
    return this.getUser(docRef.id);
  }

  async getUser(userId: string): Promise<User> {
    const snapshot = await this.collection.doc(userId).get();
    return snapshot.data();
  }
}
