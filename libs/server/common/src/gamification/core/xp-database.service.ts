import { ProcessorFactory } from '../factories/processor.factory';
import { UserActivity } from '../../activity/activity.model';
import { XpCalculationResponse } from '../models/gamification.model';
import * as logger from 'firebase-functions/logger';

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