import { logger, UserService } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { ActivityService, ProgressionService } from '@codeheroes/gamification';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const handleEventCreation = onDocumentCreated('events/{eventId}', async (event) => {
  logger.info('New event document created', {
    eventId: event.params.eventId,
  });

  const eventData = event.data?.data() as Event;
  if (!eventData) {
    logger.error('No event data found');
    return;
  }

  const activityService = new ActivityService();
  const progressionService = new ProgressionService();
  const userService = new UserService();

  const gameAction = await activityService.handleNewEvent(eventData);
  if (!gameAction) {
    logger.warn('No game action found for event', { eventId: event.params.eventId });
    return;
  } else {
    logger.log('Game action created', { gameAction });
  }

  // // Initialize user if they don't exist
  // // This should be a temporary thing
  // await userService.initializeNewUser(gameAction.userId, gameAction.userId.toString());

  await progressionService.processGameAction(gameAction);
});
