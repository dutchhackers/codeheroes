import { GameActionType } from '@codeheroes/shared/types';
import { StreakType } from '../types';
import { BaseActionHandler } from './base-action.handler';

export class CodePushHandler extends BaseActionHandler {
  protected actionType: GameActionType = 'code_push';
  protected streakType = StreakType.CodePush;

  protected calculateBaseXp(): number {
    return 120; // Code push base XP
  }

  protected calculateBonuses(metadata: Record<string, any>) {
    const bonuses = {
      multipleCommits: metadata.commits > 1 ? 250 : 0,
    };

    return {
      totalBonus: Object.values(bonuses).reduce((a, b) => a + b, 0),
      breakdown: bonuses,
    };
  }

  protected getAdditionalBadgeContext(stats: FirebaseFirestore.DocumentData): Record<string, any> {
    return {
      totalPushes: stats.totalPushes + 1,
    };
  }
}
