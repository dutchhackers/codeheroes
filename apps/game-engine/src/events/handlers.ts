import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const handleEventCreation = onDocumentCreated('events/{eventId}', (event) => {
  logger.info('New event document created', { eventId: event.params.eventId });
  throw new Error('Not Implemented');
});
