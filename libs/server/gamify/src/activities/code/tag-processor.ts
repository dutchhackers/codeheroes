import { UserActivity } from '@codeheroes/activity';
import { getCurrentTimeAsISO } from '@codeheroes/common';
import { ActivityType } from '@codeheroes/types';
import { XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityProcessor } from '../base/activity-processor.base';

export class TagActivityProcessor extends BaseActivityProcessor {
  protected async processSpecificActivity(userData: any, activity: UserActivity, xpResult: XpCalculationResponse) {
    return await this.processTagAchievements(userData, activity);
  }

  protected async getUserDocumentUpdates(userData: any, activity: UserActivity): Promise<Record<string, any>> {
    const stats = userData.stats?.tags || { total: 0, deleted: 0 };

    return {
      'stats.tags': {
        total: stats.total + (activity.type === ActivityType.TAG_CREATED ? 1 : 0),
        deleted: stats.deleted + (activity.type === ActivityType.TAG_DELETED ? 1 : 0),
      },
    };
  }

  private async processTagAchievements(userData: any, activity: UserActivity) {
    const processingResult = this.createBaseProcessingResult({ totalXp: 0, breakdown: [] });
    const stats = userData.stats?.tags || { total: 0, deleted: 0 };

    if (activity.type === ActivityType.TAG_CREATED && stats.total === 0) {
      processingResult.achievements = [
        {
          id: 'first_tag',
          name: 'Version Keeper',
          description: 'Created your first tag',
          progress: 100,
          completed: true,
          completedAt: getCurrentTimeAsISO(),
        },
      ];
    } else if (activity.type === ActivityType.TAG_DELETED && stats.deleted === 4) {
      processingResult.achievements = [
        {
          id: 'tag_cleanup',
          name: 'Tag Maintainer',
          description: 'Cleaned up 5 obsolete tags',
          progress: 100,
          completed: true,
          completedAt: getCurrentTimeAsISO(),
        },
      ];
    }

    return processingResult;
  }
}
