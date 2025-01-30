import { UserActivity } from '@codeheroes/common';
import * as logger from 'firebase-functions/logger';
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
      logger.info('Successfully processed activity', { userId, activityId, activityType: activity.type });
    } catch (error) {
      logger.error('Failed to process activity', { error, userId, activityId, activityType: activity.type });
      throw error;
    }
  }
}
