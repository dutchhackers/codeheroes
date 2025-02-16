import { ActivityService, UserActivity } from '@codeheroes/activity';
import { logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { CalculatorFactory, ProcessorFactory, XpCalculatorService, XpDatabaseService } from '@codeheroes/gamify';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

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

    // Calculate XP for the activity
    const xpCalculator = new XpCalculatorService();
    const xpResult = xpCalculator.calculateXp(activity);

    logger.info('XP calculation completed', {
      eventId,
      activityId: activity.id,
      activityType: activity.type,
      userId: activity.userId,
      totalXp: xpResult.totalXp,
      breakdown: xpResult.breakdown,
    });

    // Process and store results using the database service
    const dbService = new XpDatabaseService();
    await dbService.updateUserXp(activity.userId, activity.id, xpResult, activity);

    logger.info('Activity processed successfully', {
      eventId,
      activityId: activity.id,
      activityType: activity.type,
      userId: activity.userId,
      description: activity.userFacingDescription,
    });

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

  await processEventActivity(event.params.eventId, eventData);
});
