import { ActivityType } from '../../activity/activity.model';
import { BaseActivityCalculator } from '../activities/base/activity-calculator.base';
import { GameXpSettings } from '../models/gamification.model';
import { PushActivityCalculator } from '../activities/push/push-calculator';
import { PullRequestActivityCalculator } from '../activities/pull-request/pr-calculator';
import { IssueCalculator } from '../activities/issue/issue-calculator';
import { PrReviewCalculator } from '../activities/pr-review/pr-review-calculator';

export class CalculatorFactory {
  // Map to store calculator classes for each activity type
  private static calculators = new Map<ActivityType, new (settings: GameXpSettings) => BaseActivityCalculator>();

  static initialize() {
    // Register all calculators
    this.calculators.set(ActivityType.CODE_PUSH, PushActivityCalculator);
    this.calculators.set(ActivityType.PR_CREATED, PullRequestActivityCalculator);
    this.calculators.set(ActivityType.PR_UPDATED, PullRequestActivityCalculator);
    this.calculators.set(ActivityType.PR_MERGED, PullRequestActivityCalculator);
    this.calculators.set(ActivityType.ISSUE_CREATED, IssueCalculator);
    this.calculators.set(ActivityType.ISSUE_CLOSED, IssueCalculator);
    this.calculators.set(ActivityType.ISSUE_UPDATED, IssueCalculator);
    this.calculators.set(ActivityType.ISSUE_REOPENED, IssueCalculator);
    this.calculators.set(ActivityType.PR_REVIEW_SUBMITTED, PrReviewCalculator);
    this.calculators.set(ActivityType.PR_REVIEW_UPDATED, PrReviewCalculator);
    this.calculators.set(ActivityType.PR_REVIEW_DISMISSED, PrReviewCalculator);
    this.calculators.set(ActivityType.PR_REVIEW_THREAD_RESOLVED, PrReviewCalculator);
    this.calculators.set(ActivityType.PR_REVIEW_THREAD_UNRESOLVED, PrReviewCalculator);
    this.calculators.set(ActivityType.PR_REVIEW_COMMENT_CREATED, PrReviewCalculator);
    this.calculators.set(ActivityType.PR_REVIEW_COMMENT_UPDATED, PrReviewCalculator);
  }

  static getCalculator(type: ActivityType, settings: GameXpSettings): BaseActivityCalculator {
    const CalculatorClass = this.calculators.get(type);
    if (!CalculatorClass) {
      throw new Error(`No calculator registered for activity type: ${type}`);
    }
    return new CalculatorClass(settings);
  }
}
