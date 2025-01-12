import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { CreateActivityInput, WebhookEvent } from '@codeheroes/common';
import { getFirestore } from 'firebase-admin/firestore';

export const handleEventCreation = onDocumentCreated('events/{eventId}', async (event) => {
  logger.info('New event document created', {
    eventId: event.params.eventId,
  });

  const db = getFirestore();
  const eventData = event.data?.data() as WebhookEvent;
  
  if (!eventData) {
    logger.error('No event data found');
    return;
  }

  const userId = '1000002'; // Hardcoded user ID as requested
  
  const activityInput: CreateActivityInput = {
    userId,
    activityId: event.params.eventId,
    type: eventData.action,
    source: eventData.source,
    eventId: eventData.eventId,
    eventTimestamp: eventData.eventTimestamp,
    userFacingDescription: `${eventData.source} ${eventData.action}`, // Basic description, can be enhanced
  };

  try {
    await db
      .collection('users')
      .doc(userId)
      .collection('activities')
      .doc(event.params.eventId)
      .create(activityInput);

    logger.info('Created new user activity', { 
      userId, 
      eventId: event.params.eventId 
    });
  } catch (error) {
    logger.error('Failed to create user activity', error);
    throw error;
  }
});
