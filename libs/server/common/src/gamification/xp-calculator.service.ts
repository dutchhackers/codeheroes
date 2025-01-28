import {
  ActivityData,
  ActivityType,
  IssueActivityData,
  PullRequestActivityData,
  PushActivityData,
  ReviewActivityData,
  ReviewCommentActivityData,
  ReviewThreadActivityData,
  UserActivity,
} from '../activity/activity.model';
import {
  DEFAULT_XP_SETTINGS,
  GameXpSettings,
  XpBreakdownItem,
  XpCalculationResponse,
} from './models/gamification.model';
import { TimeUtils } from '../activity/time.utils';

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

  private isReviewActivity(data: ActivityData | undefined): data is ReviewActivityData {
    return data?.type === 'review';
  }

  private isReviewThreadActivity(data: ActivityData | undefined): data is ReviewThreadActivityData {
    return data?.type === 'review_thread';
  }

  private isReviewCommentActivity(data: ActivityData | undefined): data is ReviewCommentActivityData {
    return data?.type === 'review_comment';
  }

  private calculatePushBonus(data: PushActivityData, settings: GameXpSettings['CODE_PUSH']): XpBreakdownItem | null {
    const multipleCommitsBonus = settings.bonuses?.multipleCommits;
    if (multipleCommitsBonus && data.metrics?.commits > multipleCommitsBonus.threshold!) {
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

  private calculateReviewBonus(
    data: ReviewActivityData,
    settings: GameXpSettings['PR_REVIEW_SUBMITTED'],
  ): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];

    if (settings.bonuses?.approved && data.state === 'approved') {
      bonuses.push({
        description: settings.bonuses.approved.description,
        xp: settings.bonuses.approved.xp,
      });
    }

    if (settings.bonuses?.changesRequested && data.state === 'changes_requested') {
      bonuses.push({
        description: settings.bonuses.changesRequested.description,
        xp: settings.bonuses.changesRequested.xp,
      });
    }

    return bonuses;
  }

  private calculateReviewThreadBonus(
    data: ReviewThreadActivityData,
    settings: GameXpSettings['PR_REVIEW_THREAD_RESOLVED'],
  ): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];

    // Later: quickResolutionBonus ( settings.bonuses?.quickResolution )

    return bonuses;
  }

  private calculateReviewCommentBonus(
    data: ReviewCommentActivityData,
    settings: GameXpSettings['PR_REVIEW_COMMENT_CREATED'],
  ): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];

    // Later: add thread participation bonus if it's a reply

    return bonuses;
  }

  private calculateReviewUpdateBonus(
    data: ReviewActivityData,
    settings: GameXpSettings['PR_REVIEW_UPDATED'],
  ): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];

    // Later: quickUpdateBonus

    return bonuses;
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
    let bonuses: XpBreakdownItem[] = [];

    switch (activity.type) {
      case ActivityType.CODE_PUSH:
        if (this.isPushActivity(activity.metadata)) {
          const bonus = this.calculatePushBonus(activity.metadata, xpSettings);
          if (bonus) bonuses = [bonus];
        }
        break;
      case ActivityType.PR_MERGED:
        if (this.isPullRequestActivity(activity.metadata)) {
          const bonus = this.calculatePullRequestBonus(activity.metadata, xpSettings);
          if (bonus) bonuses = [bonus];
        }
        break;
      case ActivityType.PR_UPDATED:
        if (this.isPullRequestActivity(activity.metadata)) {
          bonuses = this.calculatePrUpdateBonus(activity.metadata, xpSettings);
        }
        break;
      case ActivityType.ISSUE_CLOSED:
        if (this.isIssueActivity(activity.metadata)) {
          const bonus = this.calculateIssueBonus(activity.metadata, xpSettings);
          if (bonus) bonuses = [bonus];
        }
        break;
      case ActivityType.PR_REVIEW_SUBMITTED:
        if (this.isReviewActivity(activity.metadata)) {
          bonuses = this.calculateReviewBonus(activity.metadata, xpSettings);
        }
        break;
      case ActivityType.PR_REVIEW_THREAD_RESOLVED:
        if (this.isReviewThreadActivity(activity.metadata)) {
          bonuses = this.calculateReviewThreadBonus(activity.metadata, xpSettings);
        }
        break;
      case ActivityType.PR_REVIEW_COMMENT_CREATED:
        if (this.isReviewCommentActivity(activity.metadata)) {
          bonuses = this.calculateReviewCommentBonus(activity.metadata, xpSettings);
        }
        break;
      case ActivityType.PR_REVIEW_UPDATED:
        if (this.isReviewActivity(activity.metadata)) {
          bonuses = this.calculateReviewUpdateBonus(activity.metadata, xpSettings);
        }
        break;
    }

    // Add all bonuses to breakdown and total
    bonuses.forEach((bonus) => {
      breakdown.push(bonus);
      totalXp += bonus.xp;
    });

    return { totalXp, breakdown };
  }
}
