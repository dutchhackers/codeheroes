import { ActivityService, WebhookEvent, logger } from '@codeheroes/common';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const activityCreationTrigger = onDocumentCreated('events/{eventId}', async (event) => {
  logger.info('New event document created', {
    eventId: event.params.eventId,
  });

  const eventData = event.data?.data() as WebhookEvent;
  if (!eventData) {
    logger.error('No event data found');
    return;
  }

  const activityService = new ActivityService();
  await activityService.handleNewEvent(event.params.eventId, eventData);
});
