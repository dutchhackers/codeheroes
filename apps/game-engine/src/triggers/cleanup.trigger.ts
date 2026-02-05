import { onSchedule } from 'firebase-functions/v2/scheduler';
import { DatabaseInstance, logger } from '@codeheroes/common';

// Collection for tracking processed Pub/Sub messages
const PROCESSED_MESSAGES_COLLECTION = '_processedMessages';

// Maximum documents to delete per batch
const BATCH_SIZE = 500;

/**
 * Scheduled function to clean up expired processed message records.
 * Runs every 6 hours to remove records older than 24 hours.
 *
 * This prevents the _processedMessages collection from growing indefinitely
 * while maintaining idempotency for recent messages.
 */
export const cleanupProcessedMessages = onSchedule(
  {
    schedule: 'every 6 hours',
    timeoutSeconds: 540, // 9 minutes max
    memory: '256MiB',
  },
  async () => {
    const db = DatabaseInstance.getInstance();
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    logger.info('Starting processed messages cleanup', {
      cutoffDate: cutoffDate.toISOString(),
    });

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      // Query for expired documents
      const expiredDocs = await db
        .collection(PROCESSED_MESSAGES_COLLECTION)
        .where('expiresAt', '<', cutoffDate)
        .limit(BATCH_SIZE)
        .get();

      if (expiredDocs.empty) {
        hasMore = false;
        break;
      }

      // Delete in batches
      const batch = db.batch();
      expiredDocs.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      totalDeleted += expiredDocs.size;

      logger.info('Deleted batch of processed messages', {
        batchSize: expiredDocs.size,
        totalDeleted,
      });

      // If we got less than the batch size, we're done
      if (expiredDocs.size < BATCH_SIZE) {
        hasMore = false;
      }
    }

    logger.info('Processed messages cleanup completed', { totalDeleted });
  }
);
