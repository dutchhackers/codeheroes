import { UserActivity, XpBreakdownItem, GameXpSettings, DEFAULT_XP_SETTINGS } from '@codeheroes/common';

export class XpCalculatorService {
  private xpSettings: GameXpSettings;

  constructor(xpSettings: GameXpSettings = DEFAULT_XP_SETTINGS) {
    this.xpSettings = xpSettings;
  }

  public calculateXpForActivity(activity: UserActivity): number {
    const xpSettings = this.xpSettings[activity.action];
    if (!xpSettings) {
      return 0;
    }

    let totalXp = xpSettings.base;

    // Add bonuses based on activity type
    if (activity.action === 'github.push' && activity.data?.type === 'push') {
      if (activity.data.commitCount > 1) {
        totalXp += xpSettings.bonuses?.multipleCommits || 0;
      }
    }

    return totalXp;
  }

  public generateXpBreakdown(activity: UserActivity): XpBreakdownItem[] {
    const breakdown: XpBreakdownItem[] = [];
    const xpSettings = this.xpSettings[activity.action];

    if (!xpSettings) {
      return breakdown;
    }

    // Add base XP
    breakdown.push({
      description: `Base XP for ${activity.action}`,
      xp: xpSettings.base,
    });

    // Add bonuses based on activity type
    if (activity.action === 'github.push' && activity.data?.type === 'push') {
      if (activity.data.commitCount > 1) {
        breakdown.push({
          description: 'Bonus for multiple commits in push',
          xp: xpSettings.bonuses?.multipleCommits || 0,
        });
      }
    }

    return breakdown;
  }
}
