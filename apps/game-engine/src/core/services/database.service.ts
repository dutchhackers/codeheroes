import * as logger from 'firebase-functions/logger';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { CreateActivityInput, getCurrentTimeAsISO } from '@codeheroes/common';

export class DatabaseService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
  }

  async lookupUserId(details: Record<string, unknown>): Promise<string | undefined> {
    const sender = details.sender as { id: string; login: string } | undefined;

    if (!sender?.id) {
      logger.warn('No sender ID found in event details');
      return undefined;
    }

    try {
      const connectedAccountSnapshot = await this.db
        .collectionGroup('connectedAccounts')
        .where('provider', '==', 'github')
        .where('externalUserId', '==', sender.id)
        .limit(1)
        .get();

      if (!connectedAccountSnapshot.empty) {
        const parentRef = connectedAccountSnapshot.docs[0].ref.parent.parent;
        if (!parentRef) {
          logger.warn('Invalid document reference structure');
          return undefined;
        }
        const userId = parentRef.id;
        logger.info('User ID found', { userId, senderId: sender.id });
        return userId;
      }

      logger.warn('No matching user found for sender', { senderId: sender.id, login: sender.login });
      return undefined;
    } catch (error) {
      logger.error('Error looking up user ID', { error, senderId: sender.id });
      throw error;
    }
  }

  async createUserActivity(activityInput: CreateActivityInput): Promise<void> {
    const userId = activityInput.userId;
    const docRef = this.db.collection('users').doc(userId).collection('activities').doc();
    const now = getCurrentTimeAsISO();

    try {
      await docRef.create({
        id: docRef.id,
        ...activityInput,
        createdAt: now,
        updatedAt: now,
      });

      logger.info('Created new user activity', { userId });
    } catch (error) {
      logger.error('Failed to create user activity', error);
      throw error;
    }
  }
}
