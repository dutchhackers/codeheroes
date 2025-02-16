import { PushActivityData, PushActivityMetrics, UserActivity } from '@codeheroes/activity';
import { ActivityType } from '@codeheroes/shared/types';
import { XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityCalculator } from '../base/activity-calculator.base';

export class PushActivityCalculator extends BaseActivityCalculator {
  calculateXp(activity: UserActivity): XpCalculationResponse {
    const { data } = activity;
    const settings = this.settings[ActivityType.CODE_PUSH];
    const breakdown = [];
    let totalXp = 0;

    // Add base XP
    const baseXp = this.createBaseXp(activity.type, settings.base);
    breakdown.push(baseXp);
    totalXp += baseXp.xp;

    // Calculate push-specific bonuses
    if (this.isPushActivity(data)) {
      const bonus = this.calculatePushBonus(data.metrics as PushActivityMetrics, settings);
      if (bonus) {
        breakdown.push(bonus);
        totalXp += bonus.xp;
      }
    }

    return { totalXp, breakdown };
  }

  private isPushActivity(data: any): data is PushActivityData {
    return data?.type === 'push';
  }

  private calculatePushBonus(metrics: PushActivityMetrics, settings: any) {
    const { multipleCommits } = settings.bonuses || {};
    if (multipleCommits && metrics?.commits > multipleCommits.threshold) {
      return {
        description: multipleCommits.description,
        xp: multipleCommits.xp,
      };
    }
    return null;
  }
}
