import { CreateActivityInput, UserActivity, WebhookEvent, logger } from '@codeheroes/common';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { DatabaseService } from '../core/services/database.service';
import { EventUtils } from './event.utils';
import { XpCalculatorService } from '../core/services/xp-calculator.service';

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
      eventType: eventData.source.type,
    });
    return;
  }

  const activityInput: CreateActivityInput = {
    action: EventUtils.getEventAction(eventData),
    eventId: event.params.eventId,
    userId,
    eventSource: eventData.source,
    data: EventUtils.extractActivityData(eventData),
    userFacingDescription: EventUtils.generateUserFacingDescription(eventData)
  };

  await dbService.createUserActivity(activityInput);
});

export const calculateXp = onDocumentCreated(
  'users/{userId}/activities/{activityId}',
  async (event) => {
    const activity = event.data?.data() as UserActivity;
    
    if (!activity) {
      logger.error('No activity data found');
      return;
    }

    const xpCalculator = new XpCalculatorService();
    const earnedXp = xpCalculator.calculateXpForActivity(activity);
    const xpBreakdown = xpCalculator.generateXpBreakdown(activity);

    logger.info('Calculated XP for activity', {
      userId: event.params.userId,
      activityId: event.params.activityId,
      earnedXp,
      xpBreakdown,
    });
  }
);
