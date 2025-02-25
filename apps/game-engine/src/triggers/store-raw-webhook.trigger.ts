import { logger, StorageService, RawWebhookData } from '@codeheroes/common';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';

export const storeRawWebhook = onMessagePublished('raw-webhooks', async (event) => {
  const storageService = new StorageService();
  const message = event.data.message.json as RawWebhookData;

  try {
    // Generate filepath based on event data
    const timestamp = message.receivedAt.replace(/[:.]/g, '-');
    const filepath = `${message.provider}-webhooks/${message.eventType}/${message.eventId}-${timestamp}.json`;

    // Store the raw JSON
    await storageService.storeFile(filepath, JSON.stringify(message, null, 2), { contentType: 'application/json' });

    logger.info(`Stored raw webhook at ${filepath}`, {
      provider: message.provider,
      eventType: message.eventType,
      eventId: message.eventId,
    });
  } catch (error) {
    logger.error('Failed to store raw webhook', { error, eventId: message.eventId });
    throw error; // Ensures Pub/Sub retries
  }
});
