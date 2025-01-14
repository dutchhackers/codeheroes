import { UserActivity, XpBreakdownItem, GameXpSettings, DEFAULT_XP_SETTINGS, XpCalculationResponse } from '@codeheroes/common';

export class XpCalculatorService {
  private xpSettings: GameXpSettings;

  constructor(xpSettings: GameXpSettings = DEFAULT_XP_SETTINGS) {
    this.xpSettings = xpSettings;
  }

  public calculateXp(activity: UserActivity): XpCalculationResponse {
    const xpSettings = this.xpSettings[activity.action];
    const breakdown: XpBreakdownItem[] = [];
    let totalXp = 0;

    if (!xpSettings) {
      return { totalXp: 0, breakdown: [] };
    }

    // Add base XP
    breakdown.push({
      description: `Base XP for ${activity.action}`,
      xp: xpSettings.base,
    });
    totalXp += xpSettings.base;

    // Calculate bonuses based on activity type
    if (activity.action === 'github.push' && activity.data?.type === 'push') {
      if (activity.data.commitCount > 1) {
        const bonus = xpSettings.bonuses?.multipleCommits || 0;
        breakdown.push({
          description: 'Bonus for multiple commits in push',
          xp: bonus,
        });
        totalXp += bonus;
      }
    }

    return {
      totalXp,
      breakdown,
    };
  }
}
