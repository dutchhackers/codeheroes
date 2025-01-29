// factories/calculator.factory.ts
import { ActivityType } from '../../activity/activity.model';
import { BaseActivityCalculator } from '../activities/base/activity-calculator.base';
import { GameXpSettings } from '../models/gamification.model';

// Import all specific activity calculators
import { PushActivityCalculator } from '../activities/push/push-calculator';
// import { PullRequestActivityCalculator } from '../activities/pull-request/pr-calculator';
// Import other calculators as needed...

export class CalculatorFactory {
  // Map to store calculator classes for each activity type
  private static calculators = new Map<ActivityType, new (settings: GameXpSettings) => BaseActivityCalculator>();

  static initialize() {
    // Register all calculators
    this.calculators.set(ActivityType.CODE_PUSH, PushActivityCalculator);
    // this.calculators.set(ActivityType.PR_CREATED, PullRequestActivityCalculator);
    // Register other calculators...
  }

  static getCalculator(type: ActivityType, settings: GameXpSettings): BaseActivityCalculator {
    const CalculatorClass = this.calculators.get(type);
    if (!CalculatorClass) {
      throw new Error(`No calculator registered for activity type: ${type}`);
    }
    return new CalculatorClass(settings);
  }
}
