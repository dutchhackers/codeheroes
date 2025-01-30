import { UserActivity } from '@codeheroes/activity';
import { GameXpSettings, XpBreakdownItem, XpCalculationResponse } from '../../models/gamification.model';

export abstract class BaseActivityCalculator {
  protected settings: GameXpSettings;

  constructor(settings: GameXpSettings) {
    this.settings = settings;
  }

  abstract calculateXp(activity: UserActivity): XpCalculationResponse;

  protected createBaseXp(activityType: string, baseXp: number): XpBreakdownItem {
    return {
      description: `Base XP for ${activityType}`,
      xp: baseXp,
    };
  }
}
