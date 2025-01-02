import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { Seeder } from '../types/seeder.interface';

export interface ConnectedAccount {
  userId: string;  // Add userId to interface
  provider: 'github' | 'strava' | 'azure' | 'bitbucket';
  externalUserId: string;
  externalUserName?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export class ConnectedAccountSeeder implements Seeder<ConnectedAccount> {
  async seed(db: Firestore, accounts: ConnectedAccount[]): Promise<void> {
    const batch = db.batch();

    for (const account of accounts) {
      const { userId, ...accountData } = account;
      const userRef = db.collection('users').doc(userId);
      const accountId = `${account.provider}_${account.externalUserId}`;
      const ref = userRef.collection('connectedAccounts').doc(accountId);
      
      batch.set(ref, {
        ...accountData,
        createdAt: account.createdAt || Timestamp.now(),
        updatedAt: account.updatedAt || Timestamp.now()
      });
    }

    await batch.commit();
  }

  async clear(db: Firestore): Promise<void> {
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    
    for (const userDoc of usersSnapshot.docs) {
      const accountsSnapshot = await userDoc.ref.collection('connectedAccounts').get();
      accountsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }
    
    await batch.commit();
  }
}
