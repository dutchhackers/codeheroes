import { GameAction, StreakType } from '../types';
import { BaseActionHandler } from './base-action.handler';

export class PullRequestCreateHandler extends BaseActionHandler {
  protected actionType = 'pull_request_create';
  protected streakType = StreakType.PullRequestCreate;

  protected calculateBaseXp(): number {
    return 100; // PR create base XP
  }

  protected calculateBonuses(metadata: Record<string, any>) {
    const bonuses = {
      multipleFiles: metadata.changedFiles > 3 ? 100 : 0,
      significantChanges: metadata.additions + metadata.deletions > 100 ? 200 : 0,
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
