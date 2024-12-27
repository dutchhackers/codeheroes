import { getFirestore, Timestamp } from 'firebase-admin/firestore';
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

  async createUser(input: CreateUserInput) {
    if (!input) {
      throw new Error('User data is required');
    }

    const now = Timestamp.now();
    const userDoc: User = {
      ...USER_DEFAULTS,
      email: input.email,
      photoUrl: input.photoURL || '',
      displayName: input.displayName || '',
      userId: '', // Empty string if this is required
      createdAt: now,
      lastLogin: now,
    };

    await this.db.collection('users').doc(input.uid).set(userDoc);
    return userDoc;
  }
}
