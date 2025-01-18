import { UserActivity, logger } from '@codeheroes/common';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { XpDatabaseService, XpCalculatorService } from '@codeheroes/gamify';

export const xpCalculationTrigger = onDocumentCreated('users/{userId}/activities/{activityId}', async (event) => {
  const activity = event.data?.data() as UserActivity;

  if (!activity) {
    logger.error('No activity data found');
    return;
  }

  const xpCalculator = new XpCalculatorService();
  const xpResult = xpCalculator.calculateXp(activity);

  logger.info('Calculated XP for activity', {
    userId: event.params.userId,
    activityId: event.params.activityId,
    ...xpResult,
  });

  const dbService = new XpDatabaseService();
  await dbService.updateUserXp(event.params.userId, event.params.activityId, xpResult, activity);
});
