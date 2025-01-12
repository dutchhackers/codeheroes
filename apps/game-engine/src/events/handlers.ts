import { CreateActivityInput, WebhookEvent, logger } from '@codeheroes/common';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
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

  const userId = await dbService.lookupUserId({
    sender: (eventData.data as any)?.sender,
    repository: (eventData.data as any)?.repository,
  });

  if (!userId) {
    logger.warn('Skipping activity creation - no matching user found', {
      eventId: event.params.eventId,
      eventType: eventData.eventType,
    });
    return;
  }

  const activityInput: CreateActivityInput = {
    action: (eventData.data as any)?.action,
    userId,
    activityId: eventData.eventId,
    type: eventData.eventType,
    eventTimestamp: eventData.eventTimestamp,
    userFacingDescription: `${eventData.source} ${eventData.eventType}`,
    eventId: event.params.eventId,
    details: {
      source: eventData.source
    }
  };

  await dbService.createUserActivity(userId, event.params.eventId, activityInput);
});
