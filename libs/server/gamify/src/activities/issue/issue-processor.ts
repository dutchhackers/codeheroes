import { ActivityType, getCurrentTimeAsISO, logger, UserActivity } from '@codeheroes/common';
import { calculateLevelProgress } from '../../core/level.utils';
import { ActivityProcessingResult, XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityProcessor } from '../base/activity-processor.base';

export class IssueProcessor extends BaseActivityProcessor {
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

        // Check for issue-specific achievements
        const processingResult = await this.processIssueAchievements(userData, activity);

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
          // Update issue-specific stats
          'stats.issues': this.updateIssueStats(userData, activity),
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

      logger.info('Successfully processed issue activity', {
        userId,
        activityId,
        activityType: activity.type,
      });
    } catch (error) {
      logger.error('Failed to process issue activity', {
        error,
        userId,
        activityId,
        activityType: activity.type,
      });
      throw error;
    }
  }

  private updateIssueStats(userData: any, activity: UserActivity): any {
    const currentStats = userData.stats?.issues || {
      total: 0,
      closed: 0,
      reopened: 0,
    };

    switch (activity.type) {
      case ActivityType.ISSUE_CREATED:
        return {
          ...currentStats,
          total: currentStats.total + 1,
        };
      case ActivityType.ISSUE_CLOSED:
        return {
          ...currentStats,
          closed: currentStats.closed + 1,
        };
      case ActivityType.ISSUE_REOPENED:
        return {
          ...currentStats,
          reopened: currentStats.reopened + 1,
        };
      default:
        return currentStats;
    }
  }

  private async processIssueAchievements(userData: any, activity: UserActivity): Promise<ActivityProcessingResult> {
    const processingResult: ActivityProcessingResult = {
      processed: true,
      processedAt: getCurrentTimeAsISO(),
      achievements: [],
    };

    const currentStats = userData.stats?.issues || { total: 0, closed: 0 };

    // First issue created achievement
    if (activity.type === ActivityType.ISSUE_CREATED && currentStats.total === 0) {
      processingResult.achievements?.push({
        id: 'first_issue',
        name: 'Issue Reporter',
        description: 'Created your first issue',
        progress: 100,
        completed: true,
        completedAt: getCurrentTimeAsISO(),
      });
    }

    // Issue resolution achievements
    if (activity.type === ActivityType.ISSUE_CLOSED) {
      const closedCount = currentStats.closed + 1;

      if (closedCount === 1) {
        processingResult.achievements?.push({
          id: 'first_issue_closed',
          name: 'Problem Solver',
          description: 'Closed your first issue',
          progress: 100,
          completed: true,
          completedAt: getCurrentTimeAsISO(),
        });
      }

      if (closedCount === 10) {
        processingResult.achievements?.push({
          id: 'issue_master',
          name: 'Issue Master',
          description: 'Closed 10 issues',
          progress: 100,
          completed: true,
          completedAt: getCurrentTimeAsISO(),
        });
      }
    }

    return processingResult;
  }
}
