import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { CreateActivityInput, WebhookEvent } from '@codeheroes/common';
import { DatabaseService } from '../core/services/database.service';

export const handleEventCreation = onDocumentCreated('events/{eventId}', async (event) => {
  logger.info('New event document created', {
    eventId: event.params.eventId,
  });

  const dbService = new DatabaseService();
  const eventData = event.data?.data() as WebhookEvent;
  
  if (!eventData) {
    logger.error('No event data found');
    return;
  }

  const userId = await dbService.lookupUserId(eventData.details);
  
  if (!userId) {
    logger.warn('Skipping activity creation - no matching user found', {
      eventId: event.params.eventId,
      authorExternalId: eventData.details.authorExternalId
    });
    return;
  }

  const activityInput: CreateActivityInput = {
    userId,
    activityId: event.params.eventId,
    type: eventData.action,
    source: eventData.source,
    eventId: eventData.eventId,
    eventTimestamp: eventData.eventTimestamp,
    userFacingDescription: `${eventData.source} ${eventData.action}`,
  };

  await dbService.createUserActivity(userId, event.params.eventId, activityInput);
});