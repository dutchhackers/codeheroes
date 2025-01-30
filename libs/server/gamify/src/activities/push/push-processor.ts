import { BaseActivityProcessor } from '../base/activity-processor.base';
import { XpCalculationResponse } from '../../models/gamification.model';
import { calculateLevelProgress } from '../../core/level.utils';
import { getCurrentTimeAsISO, UserActivity } from '@codeheroes/common';

export class PushActivityProcessor extends BaseActivityProcessor {
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

        // Create processing result
        const processingResult = this.createBaseProcessingResult(xpResult);

        // Note: This is a placeholder for the actual streak logic
        if (this.checkForPushStreak(userData)) {
          processingResult.achievements = [
            {
              id: 'push_streak',
              name: 'Push Streak',
              description: 'Made commits for 5 consecutive days',
              progress: 100,
              completed: true,
              completedAt: getCurrentTimeAsISO(),
            },
          ];
        }

        // Update user document
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
    } catch (error) {
      console.error('Failed to process push activity', { error, userId, activityId });
      throw error;
    }
  }

  private checkForPushStreak(userData: any): boolean {
    // Implement push streak checking logic
    // This is just a placeholder - you would implement your actual streak logic here
    return false;
  }
}
