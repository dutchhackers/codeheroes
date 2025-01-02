import { Firestore } from 'firebase-admin/firestore';
import { Seeder } from '../types/seeder.interface';

interface User {
    id: string;
    uid: string | null; // Firebase Auth UID
    email: string;
    displayName: string;
    photoUrl: string;
    lastLogin: string;
    active: boolean;
}

export class UserSeeder implements Seeder<User> {
  async seed(db: Firestore, users: User[]): Promise<void> {
    const batch = db.batch();
    
    for (const user of users) {
      const ref = db.collection('users').doc(user.id);
      batch.set(ref, user);
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
