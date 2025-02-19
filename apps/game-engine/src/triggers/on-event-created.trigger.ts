import { ActivityService } from '@codeheroes/activity';
import { UserActivity, UserService } from '@codeheroes/common';
import { logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { CalculatorFactory, ProcessorFactory } from '@codeheroes/gamify';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { ActivityType, GameActionType } from '@codeheroes/shared/types';
import { GameProgressionService } from '@codeheroes/gamification';

// Initialize factories once at the top level
CalculatorFactory.initialize();
ProcessorFactory.initialize();

async function processEventActivity(eventId: string, eventData: Event): Promise<UserActivity | null> {
  try {
    const activityService = new ActivityService();
    const activity = await activityService.handleNewEvent(eventId, eventData);

    if (!activity) {
      logger.warn('No activity generated for event', { eventId });
      return null;
    }

    return activity;
  } catch (error) {
    logger.error('Failed to process activity for event', { eventId, error });
    throw error;
  }
}

export const onEventCreatedTrigger = onDocumentCreated('events/{eventId}', async (event) => {
  logger.info('New event document created', {
    eventId: event.params.eventId,
  });

  const eventData = event.data?.data() as Event;
  if (!eventData) {
    logger.error('No event data found');
    return;
  }

  const activity = await processEventActivity(event.params.eventId, eventData);
  logger.log('Activity created', { activity });

  if (!activity) {
    logger.warn('No activity found for event', { eventId: event.params.eventId });
    return;
  }
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
