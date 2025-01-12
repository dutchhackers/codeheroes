import * as logger from 'firebase-functions/logger';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { CreateActivityInput } from '@codeheroes/common';

export class DatabaseService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
  }

  async lookupUserId(details: Record<string, unknown>): Promise<string | undefined> {
    const authorId = details.authorExternalId;

    if (!authorId) {
      logger.warn('No authorExternalId found in event details');
      return undefined;
    }

    try {
      const connectedAccountSnapshot = await this.db
        .collectionGroup('connectedAccounts')
        .where('provider', '==', 'github')
        .where('externalUserId', '==', authorId)
        .limit(1)
        .get();

      if (!connectedAccountSnapshot.empty) {
        const userId = connectedAccountSnapshot.docs[0].ref.parent.parent!.id;
        logger.info('User ID found', { userId, authorId });
        return userId;
      }

      logger.warn('No matching user found for author ID', { authorId });
      return undefined;
    } catch (error) {
      logger.error('Error looking up user ID', { error, authorId });
      throw error;
    }
  }

async createUserActivity(userId: string, eventId: string, activityInput: CreateActivityInput): Promise<void> {
    try {
        await this.db
            .collection('users')
            .doc(userId)
            .collection('activities')
            .doc(eventId)
            .create({
                ...activityInput,
                processed: false
            });

        logger.info('Created new user activity', { userId, eventId });
    } catch (error) {
        logger.error('Failed to create user activity', error);
        throw error;
    }
}
}
