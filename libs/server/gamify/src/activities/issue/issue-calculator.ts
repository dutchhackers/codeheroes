import { IssueActivityData, UserActivity } from '@codeheroes/activity';
import { ActivityType } from '@codeheroes/shared/types';
import { XpBreakdownItem, XpCalculationResponse } from '../../models/gamification.model';
import { BaseActivityCalculator } from '../base/activity-calculator.base';

export class IssueCalculator extends BaseActivityCalculator {
  calculateXp(activity: UserActivity): XpCalculationResponse {
    const settings = this.settings[activity.type];
    if (!settings || !this.isIssueActivity(activity.data)) {
      return { totalXp: 0, breakdown: [] };
    }

    const breakdown: XpBreakdownItem[] = [];
    let totalXp = 0;

    // Add base XP
    const baseXp = this.createBaseXp(activity.type, settings.base);
    breakdown.push(baseXp);
    totalXp += baseXp.xp;

    // Calculate bonuses based on activity type
    const bonuses = this.calculateBonuses(activity.type, activity.data, settings);
    bonuses.forEach((bonus) => {
      breakdown.push(bonus);
      totalXp += bonus.xp;
    });

    return { totalXp, breakdown };
  }

  private isIssueActivity(data: any): data is IssueActivityData {
    return data?.type === 'issue';
  }

  private calculateBonuses(activityType: ActivityType, data: IssueActivityData, settings: any): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];

    switch (activityType) {
      case ActivityType.ISSUE_CREATED:
        bonuses.push(...this.calculateCreatedBonuses(data, settings));
        break;
      case ActivityType.ISSUE_CLOSED:
        bonuses.push(...this.calculateClosedBonuses(data, settings));
        break;
      case ActivityType.ISSUE_UPDATED:
        bonuses.push(...this.calculateUpdateBonuses(data, settings));
        break;
      case ActivityType.ISSUE_REOPENED:
        bonuses.push(...this.calculateReopenedBonuses(data, settings));
        break;
    }

    return bonuses;
  }

  private calculateCreatedBonuses(data: IssueActivityData, settings: any): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];
    const { bonuses: bonusSettings } = settings;

    // // Detailed description bonus
    // if (
    //   bonusSettings?.detailedDescription &&
    //   data.description &&
    //   data.description.length >= bonusSettings.detailedDescription.threshold
    // ) {
    //   bonuses.push({
    //     description: bonusSettings.detailedDescription.description,
    //     xp: bonusSettings.detailedDescription.xp,
    //   });
    // }

    // // Labels bonus
    // if (bonusSettings?.withLabels && data.labels && data.labels.length >= bonusSettings.withLabels.threshold) {
    //   bonuses.push({
    //     description: bonusSettings.withLabels.description,
    //     xp: bonusSettings.withLabels.xp,
    //   });
    // }

    return bonuses;
  }

  private calculateClosedBonuses(data: IssueActivityData, settings: any): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];
    const { bonuses: bonusSettings } = settings;

    // Completed bonus
    if (bonusSettings?.completed && data.state === 'closed' && data.stateReason === 'completed') {
      bonuses.push({
        description: bonusSettings.completed.description,
        xp: bonusSettings.completed.xp,
      });

      //   // Quick resolution bonus
      //   if (
      //     bonusSettings?.quickResolution &&
      //     this.isWithinTimeThreshold(data.createdAt, bonusSettings.quickResolution.timeThreshold)
      //   ) {
      //     bonuses.push({
      //       description: bonusSettings.quickResolution.description,
      //       xp: bonusSettings.quickResolution.xp,
      //     });
      //   }
    }

    return bonuses;
  }

  private calculateUpdateBonuses(data: IssueActivityData, settings: any): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];
    const { bonuses: bonusSettings } = settings;

    // // Significant update bonus
    // if (
    //   bonusSettings?.significantUpdate &&
    //   data.updateContent &&
    //   data.updateContent.length >= bonusSettings.significantUpdate.threshold
    // ) {
    //   bonuses.push({
    //     description: bonusSettings.significantUpdate.description,
    //     xp: bonusSettings.significantUpdate.xp,
    //   });
    // }

    return bonuses;
  }

  private calculateReopenedBonuses(data: IssueActivityData, settings: any): XpBreakdownItem[] {
    const bonuses: XpBreakdownItem[] = [];
    const { bonuses: bonusSettings } = settings;

    // // Reopen reason bonus
    // if (
    //   bonusSettings?.withReason &&
    //   data.reopenReason &&
    //   data.reopenReason.length >= bonusSettings.withReason.threshold
    // ) {
    //   bonuses.push({
    //     description: bonusSettings.withReason.description,
    //     xp: bonusSettings.withReason.xp,
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
