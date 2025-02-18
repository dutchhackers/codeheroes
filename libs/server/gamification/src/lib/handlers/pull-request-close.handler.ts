import { GameActionType } from '@codeheroes/shared/types';
import { StreakType } from '../types';
import { BaseActionHandler } from './base-action.handler';

export class PullRequestCloseHandler extends BaseActionHandler {
  protected actionType: GameActionType = 'pull_request_close';
  protected streakType = StreakType.PullRequestClose;

  protected calculateBaseXp(): number {
    return 50; // Base XP for closing a PR without merging
  }

  protected calculateBonuses(metadata: Record<string, any>) {
    const bonuses = {
      multipleFiles: metadata.changedFiles > 3 ? 50 : 0,
      significantChanges: metadata.additions + metadata.deletions > 100 ? 100 : 0,
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
