import { UserActivity } from '@codeheroes/common';
import { XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityProcessor } from '../base/activity-processor.base';

export class PullRequestProcessor extends BaseActivityProcessor {
  protected async processSpecificActivity(userData: any, activity: UserActivity, xpResult: XpCalculationResponse) {
    return await this.processPullRequestAchievements(userData, activity);
  }

  private async processPullRequestAchievements(userData: any, activity: UserActivity) {
    const processingResult = this.createBaseProcessingResult({ totalXp: 0, breakdown: [] });
    processingResult.achievements = [];
    return processingResult;
  }
}
