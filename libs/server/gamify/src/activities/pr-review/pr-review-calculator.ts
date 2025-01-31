import {
  ActivityType,
  ReviewActivityData,
  ReviewCommentActivityData,
  ReviewThreadActivityData,
  UserActivity,
} from '@codeheroes/activity';
import { XpBreakdownItem, XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityCalculator } from '../base/activity-calculator.base';

export class PrReviewCalculator extends BaseActivityCalculator {
  calculateXp(activity: UserActivity): XpCalculationResponse {
    const settings = this.settings[activity.type];
    if (!settings || !this.isReviewRelatedActivity(activity.metadata)) {
      return { totalXp: 0, breakdown: [] };
    }

    const breakdown: XpBreakdownItem[] = [];
    let totalXp = 0;

    // Add base XP
    const baseXp = this.createBaseXp(activity.type, settings.base);
    breakdown.push(baseXp);
    totalXp += baseXp.xp;

    // Calculate bonuses based on activity type
    //const bonuses = this.calculateBonuses(activity.type, activity.metadata, settings);
    // Quick workaround to fix the error
    const bonuses = this.isReviewRelatedActivity(activity.metadata)
      ? this.calculateBonuses(
          activity.type,
          activity.metadata as ReviewActivityData | ReviewCommentActivityData | ReviewThreadActivityData,
          settings,
        )
      : [];

    bonuses.forEach((bonus) => {
      breakdown.push(bonus);
      totalXp += bonus.xp;
    });

    return { totalXp, breakdown };
  }

  private isReviewRelatedActivity(data: any): boolean {
    return this.isReviewActivity(data) || this.isReviewCommentActivity(data) || this.isReviewThreadActivity(data);
  }

  private isReviewActivity(data: any): data is ReviewActivityData {
    return data?.type === 'review';
  }

  private isReviewCommentActivity(data: any): data is ReviewCommentActivityData {
    return data?.type === 'review_comment';
  }

  private isReviewThreadActivity(data: any): data is ReviewThreadActivityData {
    return data?.type === 'review_thread';
  }

  private calculateBonuses(
    activityType: ActivityType,
    data: ReviewActivityData | ReviewCommentActivityData | ReviewThreadActivityData,
    settings: any,
  ): XpBreakdownItem[] {
    switch (activityType) {
      case ActivityType.PR_REVIEW_SUBMITTED:
        return this.calculateReviewSubmissionBonuses(data as ReviewActivityData, settings);
      case ActivityType.PR_REVIEW_COMMENT_CREATED:
        return this.calculateCommentCreationBonuses(data as ReviewCommentActivityData, settings);
      case ActivityType.PR_REVIEW_THREAD_RESOLVED:
        return this.calculateThreadResolutionBonuses(data as ReviewThreadActivityData, settings);
      default:
        return [];
    }
  }

  private calculateReviewSubmissionBonuses(data: ReviewActivityData, settings: any): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];
    const { bonuses: bonusSettings } = settings;

    if (bonusSettings?.approved && data.state === 'approved') {
      bonuses.push({
        description: bonusSettings.approved.description,
        xp: bonusSettings.approved.xp,
      });
    }

    if (bonusSettings?.changesRequested && data.state === 'changes_requested') {
      bonuses.push({
        description: bonusSettings.changesRequested.description,
        xp: bonusSettings.changesRequested.xp,
      });
    }

    // if (bonusSettings?.inDepthReview && data.body && data.body.length >= bonusSettings.inDepthReview.threshold) {
    //   bonuses.push({
    //     description: bonusSettings.inDepthReview.description,
    //     xp: bonusSettings.inDepthReview.xp,
    //   });
    // }

    return bonuses;
  }

  private calculateCommentCreationBonuses(data: ReviewCommentActivityData, settings: any): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];
    const { bonuses: bonusSettings } = settings;

    // if (bonusSettings?.detailed && data.body && data.body.length >= bonusSettings.detailed.threshold) {
    //   bonuses.push({
    //     description: bonusSettings.detailed.description,
    //     xp: bonusSettings.detailed.xp,
    //   });
    // }

    // if (bonusSettings?.inThread && data.inThread) {
    //   bonuses.push({
    //     description: bonusSettings.inThread.description,
    //     xp: bonusSettings.inThread.xp,
    //   });
    // }

    return bonuses;
  }

  private calculateThreadResolutionBonuses(data: ReviewThreadActivityData, settings: any): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];
    const { bonuses: bonusSettings } = settings;

    // if (
    //   bonusSettings?.quickResolution &&
    //   this.isWithinTimeThreshold(data.createdAt, bonusSettings.quickResolution.timeThreshold)
    // ) {
    //   bonuses.push({
    //     description: bonusSettings.quickResolution.description,
    //     xp: bonusSettings.quickResolution.xp,
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
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return value * 60 * 60 * 1000;
    }
  }
}
