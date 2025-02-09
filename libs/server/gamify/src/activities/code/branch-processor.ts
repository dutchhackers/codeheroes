import { ActivityType, UserActivity } from '@codeheroes/activity';
import { getCurrentTimeAsISO, logger } from '@codeheroes/common';
import { XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityProcessor } from '../base/activity-processor.base';

export class BranchActivityProcessor extends BaseActivityProcessor {
  protected async processSpecificActivity(userData: any, activity: UserActivity, xpResult: XpCalculationResponse) {
    return await this.processBranchAchievements(userData, activity);
  }

  protected async getUserDocumentUpdates(
    userData: any,
    activity: UserActivity,
  ): Promise<Record<string, any>> {
    const stats = userData.stats?.branches || { total: 0, deleted: 0, active: 0 };

    return {
      'stats.branches': {
        total: stats.total + (activity.type === ActivityType.BRANCH_CREATED ? 1 : 0),
        deleted: stats.deleted + (activity.type === ActivityType.BRANCH_DELETED ? 1 : 0),
        active: stats.active + (activity.type === ActivityType.BRANCH_CREATED ? 1 :
                               activity.type === ActivityType.BRANCH_DELETED ? -1 : 0),
      }
    };
  }

  private async processBranchAchievements(userData: any, activity: UserActivity) {
    const processingResult = this.createBaseProcessingResult({ totalXp: 0, breakdown: [] });
    const stats = userData.stats?.branches || { total: 0, deleted: 0, active: 0 };

    if (activity.type === ActivityType.BRANCH_CREATED && stats.total === 0) {
      processingResult.achievements = [{
        id: 'first_branch',
        name: 'Branch Master',
        description: 'Created your first development branch',
        progress: 100,
        completed: true,
        completedAt: getCurrentTimeAsISO(),
      }];
    } else if (activity.type === ActivityType.BRANCH_DELETED && stats.deleted === 9) {
      processingResult.achievements = [{
        id: 'branch_cleanup',
        name: 'Clean Maintainer',
        description: 'Cleaned up 10 merged or obsolete branches',
        progress: 100,
        completed: true,
        completedAt: getCurrentTimeAsISO(),
      }];
    }

    return processingResult;
  }
}
