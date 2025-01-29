import {
  CalculatorFactory,
  logger,
  ProcessorFactory,
  UserActivity,
  XpCalculatorService,
  XpDatabaseService,
} from '@codeheroes/common';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

// Initialize factories once at the top level
CalculatorFactory.initialize();
ProcessorFactory.initialize();

export const xpCalculationTrigger = onDocumentCreated('users/{userId}/activities/{activityId}', async (event) => {
  // const activity = event.data?.data() as UserActivity;

  // if (!activity) {
  //   logger.error('No activity data found');
  //   return;
  // }

  // const xpCalculator = new XpCalculatorService();
  // const xpResult = xpCalculator.calculateXp(activity);

  // logger.info('Calculated XP for activity', {
  //   userId: event.params.userId,
  //   activityId: event.params.activityId,
  //   ...xpResult,
  // });

  // const dbService = new XpDatabaseService();
  // await dbService.updateUserXp(event.params.userId, event.params.activityId, xpResult, activity);

  const activity = event.data?.data() as UserActivity;
  const { userId, activityId } = event.params;

  if (!activity) {
    logger.error('No activity data found', { userId, activityId });
    return;
  }

  try {
    // Log activity received
    logger.info('Processing activity', {
      userId,
      activityId,
      activityType: activity.type,
    });

    // Calculate XP using the calculator service
    const xpCalculator = new XpCalculatorService();
    const xpResult = xpCalculator.calculateXp(activity);

    logger.info('XP calculation completed', {
      userId,
      activityId,
      activityType: activity.type,
      totalXp: xpResult.totalXp,
      breakdown: xpResult.breakdown,
    });

    // Process and store results using the database service
    const dbService = new XpDatabaseService();
    await dbService.updateUserXp(userId, activityId, xpResult, activity);

    logger.info('Activity processing completed successfully', {
      userId,
      activityId,
      activityType: activity.type,
    });
  } catch (error) {
    logger.error('Failed to process activity', {
      error,
      userId,
      activityId,
      activityType: activity?.type,
    });
    throw error; // Re-throw to mark the function as failed
  }
});

// Optional: Add a cleanup trigger for deleted activities
// export const xpCleanupTrigger = onDocumentDeleted(
//   'users/{userId}/activities/{activityId}',
//   async (event) => {
//     // Add cleanup logic if needed
//   }
// );
