import { getCurrentTimeAsISO, UserActivity } from '@codeheroes/common';
import { ActivityType } from '@codeheroes/shared/types';
import { XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityProcessor } from '../base/activity-processor.base';

export class PrReviewProcessor extends BaseActivityProcessor {
  protected async processSpecificActivity(userData: any, activity: UserActivity, xpResult: XpCalculationResponse) {
    return await this.processReviewAchievements(userData, activity);
  }

  private async processReviewAchievements(userData: any, activity: UserActivity) {
    const processingResult = this.createBaseProcessingResult({ totalXp: 0, breakdown: [] });
    const stats = userData.stats?.reviews || { total: 0, approved: 0, requestedChanges: 0 };

    if (activity.type === ActivityType.PR_REVIEW_SUBMITTED) {
      if (stats.total === 0) {
        processingResult.achievements = [
          {
            id: 'first_review',
            name: 'Code Reviewer',
            description: 'Completed your first code review',
            progress: 100,
            completed: true,
            completedAt: getCurrentTimeAsISO(),
          },
        ];
      } else if (stats.total === 9) {
        processingResult.achievements = [
          {
            id: 'review_master',
            name: 'Review Master',
            description: 'Completed 10 code reviews',
            progress: 100,
            completed: true,
            completedAt: getCurrentTimeAsISO(),
          },
        ];
      }
    }

    return processingResult;
  }
}
