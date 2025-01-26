import {
  ActivityData,
  ActivityType,
  IssueActivityData,
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

  private isIssueActivity(data: ActivityData | undefined): data is IssueActivityData {
    return data?.type === 'issue';
  }

  private calculatePushBonus(data: PushActivityData, settings: GameXpSettings['CODE_PUSH']): XpBreakdownItem | null {
    const multipleCommitsBonus = settings.bonuses?.multipleCommits;
    if (multipleCommitsBonus && data.commitCount > multipleCommitsBonus.threshold!) {
      return {
        description: multipleCommitsBonus.description,
        xp: multipleCommitsBonus.xp,
      };
    }
    return null;
  }

  private calculatePullRequestBonus(
    data: PullRequestActivityData,
    settings: GameXpSettings['PR_MERGED'],
  ): XpBreakdownItem | null {
    const mergedBonus = settings.bonuses?.merged;
    if (mergedBonus && data.merged) {
      return {
        description: mergedBonus.description,
        xp: mergedBonus.xp,
      };
    }
    return null;
  }

  private calculatePrUpdateBonus(
    data: PullRequestActivityData,
    settings: GameXpSettings['PR_UPDATED'],
  ): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];
    const metrics = data.metrics;

    if (!metrics) {
      return bonuses;
    }

    const multipleFilesBonus = settings.bonuses?.multipleFiles;
    if (multipleFilesBonus && metrics.changedFiles > multipleFilesBonus.threshold!) {
      bonuses.push({
        description: multipleFilesBonus.description,
        xp: multipleFilesBonus.xp,
      });
    }

    const significantChangesBonus = settings.bonuses?.significantChanges;
    if (significantChangesBonus && metrics.additions + metrics.deletions > significantChangesBonus.threshold!) {
      bonuses.push({
        description: significantChangesBonus.description,
        xp: significantChangesBonus.xp,
      });
    }

    return bonuses;
  }

  private calculateIssueBonus(
    data: IssueActivityData,
    settings: GameXpSettings['ISSUE_CLOSED'],
  ): XpBreakdownItem | null {
    const completedBonus = settings.bonuses?.completed;
    if (completedBonus && data.state === 'closed' && data.stateReason === 'completed') {
      return {
        description: completedBonus.description,
        xp: completedBonus.xp,
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
    if (activity.type === ActivityType.CODE_PUSH && this.isPushActivity(activity.metadata)) {
      const bonus = this.calculatePushBonus(activity.metadata, xpSettings);
      if (bonus) {
        breakdown.push(bonus);
        totalXp += bonus.xp;
      }
    } else if (activity.type === ActivityType.PR_MERGED && this.isPullRequestActivity(activity.metadata)) {
      const bonus = this.calculatePullRequestBonus(activity.metadata, xpSettings);
      if (bonus) {
        breakdown.push(bonus);
        totalXp += bonus.xp;
      }
    } else if (activity.type === ActivityType.PR_UPDATED && this.isPullRequestActivity(activity.metadata)) {
      const bonuses = this.calculatePrUpdateBonus(activity.metadata, xpSettings);
      bonuses.forEach((bonus) => {
        breakdown.push(bonus);
        totalXp += bonus.xp;
      });
    } else if (activity.type === ActivityType.ISSUE_CLOSED && this.isIssueActivity(activity.metadata)) {
      const bonus = this.calculateIssueBonus(activity.metadata, xpSettings);
      if (bonus) {
        breakdown.push(bonus);
        totalXp += bonus.xp;
      }
    }

    return { totalXp, breakdown };
  }
}
