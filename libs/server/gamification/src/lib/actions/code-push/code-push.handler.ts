import { GameActionType } from '@codeheroes/shared/types';
import { BaseActionHandler } from '../base/base-action.handler';
import { StreakType } from '../../core/interfaces/streak';
import { XP_SETTINGS } from '../../constants/xp-settings';

export class CodePushHandler extends BaseActionHandler {
  protected actionType: GameActionType = 'code_push';
  protected streakType = StreakType.CodePush;

  protected calculateBaseXp(): number {
    return XP_SETTINGS.CODE_PUSH.BASE;
  }

  protected calculateBonuses(metadata: Record<string, any>) {
    const bonuses = {
      multipleCommits: metadata.commits > 1 ? XP_SETTINGS.CODE_PUSH.BONUSES.MULTIPLE_COMMITS : 0,
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
