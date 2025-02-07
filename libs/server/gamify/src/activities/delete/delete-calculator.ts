import { ActivityType, UserActivity } from '@codeheroes/activity';
import { DeleteActivityData } from '@codeheroes/activity';
import { BaseActivityCalculator } from '../base/activity-calculator.base';
import { GameXpSettings, XpCalculationResponse } from '../../models/gamification.model';

export class DeleteCalculator extends BaseActivityCalculator {
  constructor(settings: GameXpSettings) {
    super(settings);
  }

  calculateXp(activity: UserActivity): XpCalculationResponse {
    const settings = this.settings[ActivityType.BRANCH_DELETED];
    const breakdown = [];
    let totalXp = 0;

    // Add base XP
    const baseXp = this.createBaseXp(activity.type, settings.base);
    breakdown.push(baseXp);
    totalXp += baseXp.xp;

    // Calculate delete-specific bonuses
    if (this.isDeleteActivity(activity.data)) {
      const bonuses = this.calculateDeleteBonuses(activity.data, settings);
      bonuses.forEach((bonus) => {
        breakdown.push(bonus);
        totalXp += bonus.xp;
      });
    }

    return { totalXp, breakdown };
  }

  private isDeleteActivity(data: any): data is DeleteActivityData {
    return data?.type === 'delete';
  }

  private calculateDeleteBonuses(data: DeleteActivityData, settings: any) {
    const bonuses = [];
    const { tagDeletion, branchDeletion } = settings.bonuses || {};

    if (data.ref.startsWith('refs/tags/') && tagDeletion) {
      bonuses.push({
        description: tagDeletion.description,
        xp: tagDeletion.xp,
      });
    }

    if (data.ref.startsWith('refs/heads/') && branchDeletion) {
      bonuses.push({
        description: branchDeletion.description,
        xp: branchDeletion.xp,
      });
    }

    return bonuses;
  }
}
