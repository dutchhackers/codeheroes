import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { CreateActivityInput, WebhookEvent } from '@codeheroes/common';
import { getFirestore } from 'firebase-admin/firestore';

async function lookupUserId(details: Record<string, unknown>): Promise<string> {
  const db = getFirestore();
  const authorId = details.authorExternalId;

  if (!authorId) {
    logger.warn('No authorExternalId found in event details, using fallback ID');
    return '1000002';
  }

  try {
    const connectedAccountSnapshot = await db
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

    logger.warn('No matching user found for author ID, using fallback ID', { authorId });
    return '1000002';
  } catch (error) {
    logger.error('Error looking up user ID', { error, authorId });
    return '1000002';
  }
}

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

  const userId = await lookupUserId(eventData.details);
  
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