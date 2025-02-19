import { UserActivity } from '@codeheroes/common';
import { logger } from '@codeheroes/common';
import { ProcessorFactory } from '../factories/processor.factory';
import { XpCalculationResponse } from '../models/gamification.model';

export class XpDatabaseService {
  constructor() {
    ProcessorFactory.initialize();
  }

  async updateUserXp(
    userId: string,
    activityId: string,
    xpResult: XpCalculationResponse,
    activity: UserActivity,
  ): Promise<void> {
    try {
      const processor = ProcessorFactory.getProcessor(activity.type);
      await processor.processActivity(userId, activityId, activity, xpResult);
    } catch (error) {
      logger.error('Failed to process activity', { error, userId, activityId, activityType: activity.type });
      throw error;
    }
  }
}
