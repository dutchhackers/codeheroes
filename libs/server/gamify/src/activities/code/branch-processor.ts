import { ActivityType, UserActivity } from '@codeheroes/activity';
import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { calculateLevelProgress } from '../../core/level.utils';
import { XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityProcessor } from '../base/activity-processor.base';

export class BranchActivityProcessor extends BaseActivityProcessor {
  async processActivity(
    userId: string,
    activityId: string,
    activity: UserActivity,
    xpResult: XpCalculationResponse,
  ): Promise<void> {
    const userRef = this.db.collection('users').doc(userId);

    try {
      await this.db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User document not found!');
        }

        const userData = userDoc.data()!;
        const currentXp = userData.xp || 0;
        const updatedXp = currentXp + xpResult.totalXp;
        const levelProgress = calculateLevelProgress(updatedXp, userData.achievements || [], userData.tasks || []);

        // Process achievements based on branch activity type
        const processingResult = await this.processBranchAchievements(userData, activity);
        processingResult.xp = {
          processed: true,
          awarded: xpResult.totalXp,
          breakdown: xpResult.breakdown,
        };

        // Update user document
        transaction.update(userRef, {
          xp: updatedXp,
          level: levelProgress.currentLevel,
          currentLevelXp: levelProgress.currentLevelXp,
          xpToNextLevel: levelProgress.xpToNextLevel,
          'stats.branches': {
            total: (userData.stats?.branches?.total || 0) + (activity.type === ActivityType.BRANCH_CREATED ? 1 : 0),
            deleted: (userData.stats?.branches?.deleted || 0) + (activity.type === ActivityType.BRANCH_DELETED ? 1 : 0),
            active: (userData.stats?.branches?.active || 0) +
              (activity.type === ActivityType.BRANCH_CREATED ? 1 : activity.type === ActivityType.BRANCH_DELETED ? -1 : 0),
          },
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

      logger.info('Successfully processed branch activity', {
        userId,
        activityId,
        activityType: activity.type,
      });
    } catch (error) {
      logger.error('Failed to process branch activity', {
        error,
        userId,
        activityId,
        activityType: activity.type,
      });
      throw error;
    }
  }

  private async processBranchAchievements(userData: any, activity: UserActivity) {
    const processingResult = this.createBaseProcessingResult({ totalXp: 0, breakdown: [] });
    const stats = userData.stats?.branches || { total: 0, deleted: 0, active: 0 };

    if (activity.type === ActivityType.BRANCH_CREATED) {
      if (stats.total === 0) {
        processingResult.achievements?.push({
          id: 'first_branch',
          name: 'Branch Master',
          description: 'Created your first development branch',
          progress: 100,
          completed: true,
          completedAt: getCurrentTimeAsISO(),
        });
      }
    } else if (activity.type === ActivityType.BRANCH_DELETED) {
      if (stats.deleted === 9) { // 10th branch deletion (counting the current one)
        processingResult.achievements?.push({
          id: 'branch_cleanup',
          name: 'Clean Maintainer',
          description: 'Cleaned up 10 merged or obsolete branches',
          progress: 100,
          completed: true,
          completedAt: getCurrentTimeAsISO(),
        });
      }
    }

    return processingResult;
  }
}
