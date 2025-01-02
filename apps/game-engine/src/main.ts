import * as logger from 'firebase-functions/logger';
import { onRequest } from 'firebase-functions/v2/https';

export const healthCheck = onRequest((request, response) => {
  logger.info("Health check requested", {structuredData: true});
  response.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'game-engine'
  });
});
