import { GameActionType } from '@codeheroes/types';
import { AbstractActionHandler } from '../base/abstract-action.handler';
import { XP_VALUES } from '../../constants/xp-values.config';

export class PullRequestMergeHandler extends AbstractActionHandler {
  protected actionType: GameActionType = 'pull_request_merge';

  protected calculateBaseXp(): number {
    return XP_VALUES.PULL_REQUEST.MERGE.BASE;
  }

  protected calculateBonuses(metadata: Record<string, any>) {
    const bonuses = {
      multipleFiles: metadata.changedFiles > 3 ? XP_VALUES.PULL_REQUEST.MERGE.BONUSES.MULTIPLE_FILES : 0,
      significantChanges:
        metadata.additions + metadata.deletions > 100 ? XP_VALUES.PULL_REQUEST.MERGE.BONUSES.SIGNIFICANT_CHANGES : 0,
      qualityBonus: metadata.approvals > 1 ? metadata.approvals * 50 : 0,
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
