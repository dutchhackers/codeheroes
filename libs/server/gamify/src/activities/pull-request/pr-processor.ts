import { ActivityType, UserActivity } from '@codeheroes/activity';
import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { calculateLevelProgress } from '../../core/level.utils';
import { ActivityProcessingResult, XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityProcessor } from '../base/activity-processor.base';

export class PullRequestProcessor extends BaseActivityProcessor {
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

        // Check for PR-specific achievements
        const processingResult = await this.processPullRequestAchievements(userData, activity);

        // Add XP calculation results
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

      logger.info('Successfully processed pull request activity', {
        userId,
        activityId,
        activityType: activity.type,
      });
    } catch (error) {
      logger.error('Failed to process pull request activity', {
        error,
        userId,
        activityId,
        activityType: activity.type,
      });
      throw error;
    }
  }

  private async processPullRequestAchievements(
    userData: any,
    activity: UserActivity,
  ): Promise<ActivityProcessingResult> {
    const processingResult: ActivityProcessingResult = {
      processed: true,
      processedAt: getCurrentTimeAsISO(),
      achievements: [],
    };

    // always return for now
    if (userData) {
      return processingResult;
    }

    // Check for first PR achievement
    if (!userData.stats?.pullRequests?.total) {
      processingResult.achievements?.push({
        id: 'first_pr',
        name: 'First Pull Request',
        description: 'Created your first pull request',
        progress: 100,
        completed: true,
        completedAt: getCurrentTimeAsISO(),
      });
    }

    // Check for PR merge achievements
    if (activity.type === ActivityType.PR_MERGED) {
      const mergedCount = (userData.stats?.pullRequests?.merged || 0) + 1;

      // Achievement for first merged PR
      if (mergedCount === 1) {
        processingResult.achievements?.push({
          id: 'first_merged_pr',
          name: 'First Merged PR',
          description: 'Got your first pull request merged',
          progress: 100,
          completed: true,
          completedAt: getCurrentTimeAsISO(),
        });
      }

      // Achievement for 10 merged PRs
      if (mergedCount === 10) {
        processingResult.achievements?.push({
          id: 'pr_master',
          name: 'PR Master',
          description: 'Got 10 pull requests merged',
          progress: 100,
          completed: true,
          completedAt: getCurrentTimeAsISO(),
        });
      }
    }

    return processingResult;
  }
}
