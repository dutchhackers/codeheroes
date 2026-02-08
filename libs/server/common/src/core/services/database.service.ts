import { logger } from '../firebase/logger.util';
import { BaseFirestoreService } from './base.service';
import { DocumentData } from 'firebase-admin/firestore';

export class DatabaseService extends BaseFirestoreService<DocumentData> {
  protected collection = this.db.collection('users'); // You might want to adjust this collection name

  constructor() {
    super();
  }

  async lookupUserId(details: Record<string, unknown>): Promise<string | undefined> {
    const sender = details.sender as { id: string } | undefined;

    if (!sender?.id) {
      logger.warn('No sender ID found in event details');
      return undefined;
    }

    const provider = details.provider as string;
    if (!provider) {
      logger.error('No provider specified in lookupUserId — refusing to default to github', {
        senderId: sender.id,
      });
      return undefined;
    }

    try {
      const connectedAccountSnapshot = await this.db
        .collectionGroup('connectedAccounts')
        .where('provider', '==', provider)
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

      logger.warn('No matching user found for sender', { provider, senderId: sender.id });
      return undefined;
    } catch (error) {
      logger.error('Error looking up user ID', { error, senderId: sender.id });
      throw error;
    }
  }
}
