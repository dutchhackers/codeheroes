import * as logger from 'firebase-functions/logger';
import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const healthCheck = onRequest((request, response) => {
  logger.info("Health check requested", {structuredData: true});
  response.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'game-engine'
  });
});

export const handleEventCreation = onDocumentCreated('events/{eventId}', (event) => {
  logger.info('New event document created', { eventId: event.params.eventId });
  throw new Error('Not Implemented');
});
