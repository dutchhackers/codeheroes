import { getCurrentTimeAsISO, UserActivity } from '@codeheroes/common';
import { ActivityType } from '@codeheroes/shared/types';
import { XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityProcessor } from '../base/activity-processor.base';

export class IssueProcessor extends BaseActivityProcessor {
  protected async processSpecificActivity(userData: any, activity: UserActivity, xpResult: XpCalculationResponse) {
    return await this.processIssueAchievements(userData, activity);
  }

  protected async getUserDocumentUpdates(userData: any, activity: UserActivity): Promise<Record<string, any>> {
    const stats = userData.stats?.issues || { total: 0, closed: 0 };

    if (activity.type === ActivityType.ISSUE_CREATED) {
      return {
        'stats.issues.total': stats.total + 1,
      };
    } else if (activity.type === ActivityType.ISSUE_CLOSED) {
      return {
        'stats.issues.closed': stats.closed + 1,
      };
    }

    return {};
  }

  private async processIssueAchievements(userData: any, activity: UserActivity) {
    const processingResult = this.createBaseProcessingResult({ totalXp: 0, breakdown: [] });
    const stats = userData.stats?.issues || { total: 0, closed: 0 };

    if (activity.type === ActivityType.ISSUE_CREATED && stats.total === 0) {
      processingResult.achievements = [
        {
          id: 'first_issue',
          name: 'Issue Reporter',
          description: 'Created your first issue',
          progress: 100,
          completed: true,
          completedAt: getCurrentTimeAsISO(),
        },
      ];
    } else if (activity.type === ActivityType.ISSUE_CLOSED && stats.closed === 9) {
      processingResult.achievements = [
        {
          id: 'issue_master',
          name: 'Issue Master',
          description: 'Closed 10 issues',
          progress: 100,
          completed: true,
          completedAt: getCurrentTimeAsISO(),
        },
      ];
    }

    return processingResult;
  }
}
