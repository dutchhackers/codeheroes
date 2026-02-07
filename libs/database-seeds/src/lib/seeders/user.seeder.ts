import { Firestore } from 'firebase-admin/firestore';
import { Seeder } from '../types/seeder.interface';
import { UserType } from '@codeheroes/types';

interface User {
  id: string;
  uid: string | null; // Firebase Auth UID
  email: string;
  displayName: string;
  photoUrl: string;
  lastLogin: string; // ISO string
  active: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  userType: UserType;
}

export class UserSeeder implements Seeder<User> {
  async seed(db: Firestore, users: User[]): Promise<void> {
    const batch = db.batch();

    for (const user of users) {
      const ref = db.collection('users').doc(user.id);
      const now = new Date().toISOString();
      // Ensure all users have a userType, default to 'user' if not provided
      batch.set(ref, {
        ...user,
        displayNameLower: user.displayName.toLowerCase(),
        userType: user.userType || 'user',
        createdAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();
  }

  async clear(db: Firestore): Promise<void> {
    const snapshot = await db.collection('users').get();
    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
}
