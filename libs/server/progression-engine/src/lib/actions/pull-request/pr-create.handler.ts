import { GameActionType } from '@codeheroes/types';
import { XP_VALUES } from '../../config/xp-values.config';
import { AbstractActionHandler } from '../base/abstract-action.handler';

export class PullRequestCreateHandler extends AbstractActionHandler {
  protected actionType: GameActionType = 'pull_request_create';

  protected calculateBaseXp(): number {
    return XP_VALUES.PULL_REQUEST.CREATE.BASE;
  }

  protected calculateBonuses(metadata: Record<string, any>) {
    const bonuses = {
      multipleFiles: metadata.changedFiles > 3 ? XP_VALUES.PULL_REQUEST.CREATE.BONUSES.MULTIPLE_FILES : 0,
      significantChanges:
        metadata.additions + metadata.deletions > 100 ? XP_VALUES.PULL_REQUEST.CREATE.BONUSES.SIGNIFICANT_CHANGES : 0,
    };

    return {
      totalBonus: Object.values(bonuses).reduce((a, b) => a + b, 0),
      breakdown: bonuses,
    };
  }

  protected getAdditionalBadgeContext(stats: FirebaseFirestore.DocumentData): Record<string, any> {
    return {
      totalPRs: stats.totalPRs + 1,
    };
  }
}
