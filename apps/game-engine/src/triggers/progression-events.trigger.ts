import { EventProcessorService } from '@codeheroes/progression-engine';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { DatabaseInstance, logger } from '@codeheroes/common';
import { ProgressionEventType } from '@codeheroes/types';
import { FieldValue } from 'firebase-admin/firestore';

// Collection for tracking processed Pub/Sub messages to prevent duplicate processing
const PROCESSED_MESSAGES_COLLECTION = '_processedMessages';

// Firestore error code for ALREADY_EXISTS
const ALREADY_EXISTS_ERROR_CODE = 6;

// TTL for processed message records (24 hours in milliseconds)
const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Checks if a Pub/Sub message has already been processed.
 * Uses atomic create() to ensure only one instance processes the message.
 *
 * @param messageId The unique Pub/Sub message ID
 * @returns true if this is the first processing attempt, false if already processed
 */
async function tryMarkMessageAsProcessed(messageId: string): Promise<boolean> {
  const db = DatabaseInstance.getInstance();
  const processedRef = db.collection(PROCESSED_MESSAGES_COLLECTION).doc(messageId);

  try {
    // Use create() which atomically fails if document already exists
    await processedRef.create({
      processedAt: FieldValue.serverTimestamp(),
      // TTL field for Firestore TTL policy or manual cleanup
      expiresAt: new Date(Date.now() + MESSAGE_TTL_MS),
    });
    return true; // Successfully marked as processing
  } catch (error: unknown) {
    // Check if this is an ALREADY_EXISTS error
    const firestoreError = error as { code?: number | string };
    if (firestoreError.code === ALREADY_EXISTS_ERROR_CODE || firestoreError.code === 'ALREADY_EXISTS') {
      logger.info('Message already processed', { messageId });
      return false; // Already processed
    }
    // For other errors, log and rethrow
    logger.error('Error checking message idempotency', { messageId, error });
    throw error;
  }
}

export const onLevelUp = onMessagePublished('progression-events', async (event) => {
  const messageId = event.data.message.messageId;

  logger.info('Received progression event', {
    messageId,
    eventType: event.data.message.json.type,
    data: event.data.message.json,
  });

  const progressionEvent = event.data.message.json;
  if (progressionEvent.type !== ProgressionEventType.LEVEL_UP) {
    logger.info('Skipping non-level-up event');
    return;
  }

  // Check for duplicate message processing
  const shouldProcess = await tryMarkMessageAsProcessed(`levelup_${messageId}`);
  if (!shouldProcess) {
    logger.info('Level-up message already processed, skipping', { messageId });
    return;
  }

  const eventHandler = new EventProcessorService();
  logger.info('Processing level up event', { userId: progressionEvent.userId });
  await eventHandler.handleEvent(progressionEvent);
  logger.info('Level up event processed successfully');
});

export const onBadgeEarned = onMessagePublished('progression-events', async (event) => {
  const messageId = event.data.message.messageId;
  const progressionEvent = event.data.message.json;

  if (progressionEvent.type !== ProgressionEventType.BADGE_EARNED) {
    return;
  }

  // Check for duplicate message processing
  const shouldProcess = await tryMarkMessageAsProcessed(`badge_${messageId}`);
  if (!shouldProcess) {
    logger.info('Badge earned message already processed, skipping', { messageId });
    return;
  }

  const eventHandler = new EventProcessorService();
  await eventHandler.handleEvent(progressionEvent);
});
