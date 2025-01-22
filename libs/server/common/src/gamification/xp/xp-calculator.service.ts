import {
  ActivityData,
  ActivityType,
  PullRequestActivityData,
  PushActivityData,
  UserActivity,
} from '../../activity/activity.model';
import {
  DEFAULT_XP_SETTINGS,
  GameXpSettings,
  XpBreakdownItem,
  XpCalculationResponse,
} from '../gamification-domain.model';

export class XpCalculatorService {
  private xpSettings: GameXpSettings;

  constructor(xpSettings: GameXpSettings = DEFAULT_XP_SETTINGS) {
    this.xpSettings = xpSettings;
  }

  private isPushActivity(data: ActivityData | undefined): data is PushActivityData {
    return data?.type === 'push';
  }

  private isPullRequestActivity(data: ActivityData | undefined): data is PullRequestActivityData {
    return data?.type === 'pull_request';
  }

  private calculatePushBonus(data: PushActivityData, settings: GameXpSettings['github.push']): XpBreakdownItem | null {
    if (data.commitCount > 1) {
      return {
        description: 'Bonus for multiple commits in push',
        xp: settings.bonuses?.multipleCommits || 0,
      };
    }
    return null;
  }

  private calculatePullRequestBonus(
    data: PullRequestActivityData,
    settings: GameXpSettings['github.pull_request.closed'],
  ): XpBreakdownItem | null {
    if (data.merged) {
      return {
        description: 'Bonus for merging pull request',
        xp: settings.bonuses?.merged || 0,
      };
    }
    return null;
  }

  public calculateXp(activity: UserActivity): XpCalculationResponse {
    const xpSettings = this.xpSettings[activity.type];
    const breakdown: XpBreakdownItem[] = [];
    let totalXp = 0;

    if (!xpSettings) {
      return { totalXp: 0, breakdown: [] };
    }

    // Add base XP
    breakdown.push({
      description: `Base XP for ${activity.type}`,
      xp: xpSettings.base,
    });
    totalXp += xpSettings.base;

    // Calculate bonuses based on activity type
    let bonus: XpBreakdownItem | null = null;

    if (activity.type === ActivityType.CODE_PUSH && this.isPushActivity(activity.metadata)) {
      bonus = this.calculatePushBonus(activity.metadata, xpSettings);
    } else if (activity.type === ActivityType.PR_MERGED && this.isPullRequestActivity(activity.metadata)) {
      bonus = this.calculatePullRequestBonus(activity.metadata, xpSettings);
    }

    if (bonus) {
      breakdown.push(bonus);
      totalXp += bonus.xp;
    }

    return { totalXp, breakdown };
  }
}
