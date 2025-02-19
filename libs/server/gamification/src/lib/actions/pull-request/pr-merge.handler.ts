import { GameActionType } from '@codeheroes/shared/types';
import { BaseActionHandler } from '../base/base-action.handler';
import { StreakType } from '../../core/interfaces/streak';
import { XP_SETTINGS } from '../../constants/xp-settings';

export class PullRequestMergeHandler extends BaseActionHandler {
  protected actionType: GameActionType = 'pull_request_merge';
  protected streakType = StreakType.PullRequestMerge;

  protected calculateBaseXp(): number {
    return XP_SETTINGS.PULL_REQUEST.MERGE.BASE;
  }

  protected calculateBonuses(metadata: Record<string, any>) {
    const bonuses = {
      multipleFiles: metadata.changedFiles > 3 ? XP_SETTINGS.PULL_REQUEST.MERGE.BONUSES.MULTIPLE_FILES : 0,
      significantChanges:
        metadata.additions + metadata.deletions > 100 ? XP_SETTINGS.PULL_REQUEST.MERGE.BONUSES.SIGNIFICANT_CHANGES : 0,
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
