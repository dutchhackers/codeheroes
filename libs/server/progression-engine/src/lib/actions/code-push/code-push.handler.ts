import { GameActionType } from '@codeheroes/types';
import { AbstractActionHandler } from '../base/abstract-action.handler';
import { XP_SETTINGS } from '../../constants/xp-values.config';

export class CodePushHandler extends AbstractActionHandler {
  protected actionType: GameActionType = 'code_push';

  protected calculateBaseXp(): number {
    return XP_SETTINGS.CODE_PUSH.BASE;
  }

  protected calculateBonuses(metadata: Record<string, any>) {
    let bonusXP = 0;
    const breakdown: Record<string, number> = {};

    // Multiple commits bonus
    if (metadata.commits > 1) {
      const multipleCommitsBonus = XP_SETTINGS.CODE_PUSH.BONUSES.MULTIPLE_COMMITS;
      bonusXP += multipleCommitsBonus;
      breakdown.multipleCommits = multipleCommitsBonus;
    }

    return {
      totalBonus: bonusXP,
      breakdown,
    };
  }
}
