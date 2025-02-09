import { ActivityType, PullRequestActivityData, PullRequestActivityMetrics, UserActivity } from '@codeheroes/activity';
import { XpBreakdownItem, XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityCalculator } from '../base/activity-calculator.base';

export class PullRequestActivityCalculator extends BaseActivityCalculator {
  calculateXp(activity: UserActivity): XpCalculationResponse {
    const { data } = activity;
    const settings = this.settings[activity.type];
    if (!settings || !this.isPullRequestActivity(data)) {
      return { totalXp: 0, breakdown: [] };
    }

    const breakdown: XpBreakdownItem[] = [];
    let totalXp = 0;

    // Add base XP
    const baseXp = this.createBaseXp(activity.type, settings.base);
    breakdown.push(baseXp);
    totalXp += baseXp.xp;

    // Calculate bonuses based on activity type
    const bonuses = this.calculateBonuses(activity.type, data, data.metrics as PullRequestActivityMetrics, settings);
    bonuses.forEach((bonus) => {
      breakdown.push(bonus);
      totalXp += bonus.xp;
    });

    return { totalXp, breakdown };
  }

  private isPullRequestActivity(data: any): data is PullRequestActivityData {
    return data?.type === 'pull_request';
  }

  private calculateBonuses(
    activityType: ActivityType,
    data: PullRequestActivityData,
    metrics: PullRequestActivityMetrics,
    settings: any,
  ): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];

    switch (activityType) {
      case ActivityType.PR_CREATED:
        bonuses.push(...this.calculateCreatedBonuses(data, settings));
        break;
      case ActivityType.PR_UPDATED:
        bonuses.push(...this.calculateUpdateBonuses(data, metrics, settings));
        break;
      case ActivityType.PR_MERGED:
        bonuses.push(...this.calculateMergeBonuses(data, settings));
        break;
      case ActivityType.PR_REVIEW_SUBMITTED:
        bonuses.push(...this.calculateReviewBonuses(data, settings));
        break;
    }

    return bonuses;
  }

  private calculateCreatedBonuses(data: PullRequestActivityData, settings: any): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];
    const { bonuses: bonusSettings } = settings;

    // Ready for review bonus
    if (bonusSettings?.readyForReview && !data.draft) {
      bonuses.push({
        description: bonusSettings.readyForReview.description,
        xp: bonusSettings.readyForReview.xp,
      });
    }

    // Description bonus
    // for later
    /*
    if (
      bonusSettings?.withDescription &&
      data.description &&
      data.description.length >= bonusSettings.withDescription.threshold
    ) {
      bonuses.push({
        description: bonusSettings.withDescription.description,
        xp: bonusSettings.withDescription.xp,
      });
    }
      */

    return bonuses;
  }

  private calculateUpdateBonuses(
    data: PullRequestActivityData,
    metrics: PullRequestActivityMetrics,
    settings: any,
  ): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];
    const { bonuses: bonusSettings } = settings;

    if (!metrics) return bonuses;

    // Multiple files bonus
    if (bonusSettings?.multipleFiles && metrics.changedFiles > bonusSettings.multipleFiles.threshold) {
      bonuses.push({
        description: bonusSettings.multipleFiles.description,
        xp: bonusSettings.multipleFiles.xp,
      });
    }

    // Significant changes bonus
    if (
      bonusSettings?.significantChanges &&
      metrics.additions + metrics.deletions > bonusSettings.significantChanges.threshold
    ) {
      bonuses.push({
        description: bonusSettings.significantChanges.description,
        xp: bonusSettings.significantChanges.xp,
      });
    }

    return bonuses;
  }

  private calculateMergeBonuses(data: PullRequestActivityData, settings: any): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];
    const { bonuses: bonusSettings } = settings;

    // Merged bonus
    if (bonusSettings?.merged && data.merged) {
      bonuses.push({
        description: bonusSettings.merged.description,
        xp: bonusSettings.merged.xp,
      });

      //   // Quick merge bonus
      //   if (
      //     bonusSettings?.quickMerge &&
      //     this.isWithinTimeThreshold(data.createdAt, bonusSettings.quickMerge.timeThreshold)
      //   ) {
      //     bonuses.push({
      //       description: bonusSettings.quickMerge.description,
      //       xp: bonusSettings.quickMerge.xp,
      //     });
      //   }
    }

    return bonuses;
  }

  private calculateReviewBonuses(data: PullRequestActivityData, settings: any): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];
    const { bonuses: bonusSettings } = settings;

    // if (bonusSettings?.approved && data.state === 'approved') {
    //   bonuses.push({
    //     description: bonusSettings.approved.description,
    //     xp: bonusSettings.approved.xp,
    //   });
    // }

    // if (bonusSettings?.changesRequested && data.state === 'changes_requested') {
    //   bonuses.push({
    //     description: bonusSettings.changesRequested.description,
    //     xp: bonusSettings.changesRequested.xp,
    //   });
    // }

    // if (
    //   bonusSettings?.detailedReview &&
    //   data.reviewComment &&
    //   data.reviewComment.length >= bonusSettings.detailedReview.threshold
    // ) {
    //   bonuses.push({
    //     description: bonusSettings.detailedReview.description,
    //     xp: bonusSettings.detailedReview.xp,
    //   });
    // }

    return bonuses;
  }

  private isWithinTimeThreshold(startTime: string, threshold: string): boolean {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const thresholdMs = this.parseTimeThreshold(threshold);
    return now - start <= thresholdMs;
  }

  private parseTimeThreshold(threshold: string): number {
    const value = parseInt(threshold);
    const unit = threshold.slice(-1);
    switch (unit) {
      case 'h':
        return value * 60 * 60 * 1000; // hours to ms
      case 'd':
        return value * 24 * 60 * 60 * 1000; // days to ms
      default:
        return value * 60 * 60 * 1000; // default to hours
    }
  }
}
