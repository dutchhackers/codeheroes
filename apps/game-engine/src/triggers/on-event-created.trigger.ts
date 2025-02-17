import { ActivityService } from '@codeheroes/activity';
import { UserActivity } from '@codeheroes/common';
import { logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { CalculatorFactory, ProcessorFactory } from '@codeheroes/gamify';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { GameProgressionService } from '../core/game-progression.service';
import { GameActionType } from '@codeheroes/shared/types';

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

  const activityActionType = getActionType(activity);
  if (!activityActionType) {
    logger.warn('No action type found for activity', { activity });
    return;
  }

  const gameService = new GameProgressionService();
  await gameService.processGameAction({
    userId: activity.userId,
    actionType: activityActionType,
    metadata: activity.data?.metrics
      ? {
          ...(activity.data.metrics || {}),
        }
      : {},
  });
});

function getActionType(activity: UserActivity): GameActionType {
  if (activity.type === 'PR_CREATED') {
    return 'pull_request_create';
  }

  return;
}
