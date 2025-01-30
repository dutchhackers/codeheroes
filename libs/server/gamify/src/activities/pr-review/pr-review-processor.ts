import { getCurrentTimeAsISO, logger, UserActivity } from '@codeheroes/common';
import { calculateLevelProgress } from '../../core/level.utils';
import { ActivityProcessingResult, XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityProcessor } from '../base/activity-processor.base';

export class PrReviewProcessor extends BaseActivityProcessor {
  async processActivity(
    userId: string,
    activityId: string,
    activity: UserActivity,
    xpResult: XpCalculationResponse,
  ): Promise<void> {
    const userRef = this.db.collection('users').doc(userId);

    try {
      await this.db.runTransaction(async (transaction) => {
        // Get user document
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User document not found!');
        }

        const userData = userDoc.data()!;

        // Calculate new XP and level
        const currentXp = userData.xp || 0;
        const updatedXp = currentXp + xpResult.totalXp;
        const levelProgress = calculateLevelProgress(updatedXp, userData.achievements || [], userData.tasks || []);

        // Create basic processing result
        const processingResult: ActivityProcessingResult = {
          processed: true,
          processedAt: getCurrentTimeAsISO(),
          xp: {
            processed: true,
            awarded: xpResult.totalXp,
            breakdown: xpResult.breakdown,
          },
        };

        // Update user document with XP and level
        transaction.update(userRef, {
          xp: updatedXp,
          level: levelProgress.currentLevel,
          currentLevelXp: levelProgress.currentLevelXp,
          xpToNextLevel: levelProgress.xpToNextLevel,
          updatedAt: getCurrentTimeAsISO(),
        });

        // Update activity document
        await this.updateActivityDocument(userRef, activityId, processingResult);

        // Create XP history entry
        await this.createXpHistoryEntry(
          userRef,
          activity,
          xpResult,
          updatedXp,
          levelProgress.currentLevel,
          levelProgress.currentLevelXp,
        );
      });

      logger.info('Successfully processed review activity', {
        userId,
        activityId,
        activityType: activity.type,
      });
    } catch (error) {
      logger.error('Failed to process review activity', {
        error,
        userId,
        activityId,
        activityType: activity.type,
      });
      throw error;
    }
  }
}
