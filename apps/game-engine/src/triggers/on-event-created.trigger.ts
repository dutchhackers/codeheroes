import { logger, UserService } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { GameProgressionService } from '@codeheroes/gamification';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const onEventCreatedTrigger = onDocumentCreated('events/{eventId}', async (event) => {
  // deprecated
});

export const onEventCreated = onDocumentCreated('events/{eventId}', async (event) => {
  logger.info('New event document created', {
    eventId: event.params.eventId,
  });

  const eventData = event.data?.data() as Event;
  if (!eventData) {
    logger.error('No event data found');
    return;
  }

  const gameService = new GameProgressionService();
  const userService = new UserService();

  const gameAction = await gameService.handleNewEvent(eventData);
  if (!gameAction) {
    logger.warn('No game action found for event', { eventId: event.params.eventId });
    return;
  } else {
    logger.log('Game action created', { gameAction });
  }

  // Initialize user if they don't exist
  // This should be a temporary thing
  await userService.initializeNewUser(gameAction.userId, gameAction.userId.toString());

  await gameService.processGameAction(gameAction);
});
