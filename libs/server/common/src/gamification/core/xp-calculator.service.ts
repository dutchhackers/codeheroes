import { CalculatorFactory } from '../factories/calculator.factory';
import { UserActivity } from '../../activity/activity.model';
import { DEFAULT_XP_SETTINGS, GameXpSettings, XpCalculationResponse } from '../models/gamification.model';

export class XpCalculatorService {
  private xpSettings: GameXpSettings;

  constructor(xpSettings: GameXpSettings = DEFAULT_XP_SETTINGS) {
    this.xpSettings = xpSettings;
    CalculatorFactory.initialize();
  }

  public calculateXp(activity: UserActivity): XpCalculationResponse {
    try {
      const calculator = CalculatorFactory.getCalculator(activity.type, this.xpSettings);
      return calculator.calculateXp(activity);
    } catch (error) {
      console.error('Error calculating XP:', error);
      return { totalXp: 0, breakdown: [] };
    }
  }
}
