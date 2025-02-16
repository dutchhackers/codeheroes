import { UserActivity } from '@codeheroes/activity';
import { XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityCalculator } from '../base/activity-calculator.base';
import { ActivityType } from '@codeheroes/types';

export class BranchActivityCalculator extends BaseActivityCalculator {
  calculateXp(activity: UserActivity): XpCalculationResponse {
    const settings = this.settings[activity.type];
    const breakdown = [];
    let totalXp = 0;

    // Add base XP
    const baseXp = this.createBaseXp(activity.type, settings.base);
    breakdown.push(baseXp);
    totalXp += baseXp.xp;

    // Add activity-specific bonus
    const bonusConfig =
      activity.type === ActivityType.BRANCH_CREATED ? settings.bonuses?.creation : settings.bonuses?.deletion;

    if (bonusConfig) {
      breakdown.push({
        description: bonusConfig.description,
        xp: bonusConfig.xp,
      });
      totalXp += bonusConfig.xp;
    }

    return { totalXp, breakdown };
  }
}
