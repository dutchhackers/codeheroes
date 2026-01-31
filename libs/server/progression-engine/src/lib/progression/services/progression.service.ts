import { logger } from '@codeheroes/common';
import { GameAction, ActionResult, GameActionActivity } from '@codeheroes/types';

import { ProgressionRepository } from '../repositories/progression.repository';
import { ActivityRepository } from '../repositories/activity.repository';
import { GameActionRepository } from '../repositories/game-action.repository';
import { XpCalculatorService } from './xp-calculator.service';
import { ActivityRecorderService } from './activity-recorder.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { ProgressionUpdate } from '../core/progression-state.model';

/**
 * Main service for managing user progression
 * Acts as a facade to coordinate between specialized services
 */
export class ProgressionService {
  constructor(
    private stateRepository: ProgressionRepository,
    private activityRepository: ActivityRepository,
    private gameActionRepository: GameActionRepository,
    private xpCalculator: XpCalculatorService,
    private activityRecorder: ActivityRecorderService,
    private eventPublisher: EventPublisherService,
  ) {}

  /**
   * Process a game action and update user progression
   * @param action The game action to process
   * @returns Result of the action processing
   */
  async processGameAction(action: GameAction): Promise<ActionResult> {
    const { id, type, userId } = action;
    logger.info(`Processing game action: ${action.type} for user: ${action.userId}`, {
      actionId: id,
      actionType: type,
      userId,
    });

    try {
      // 1. Get or create user's progression state
      let state = await this.stateRepository.getState(action.userId);
      if (!state) {
        state = await this.stateRepository.createInitialState(action.userId);
      }

      // 2. Calculate XP for the action
      const xpResult = await this.xpCalculator.calculateForAction(action);
      logger.info('XP calculation result', {
        userId: action.userId,
        actionType: action.type,
        xpGained: xpResult.total,
        breakdown: xpResult.breakdown,
      });

      // 3. Create activity record
      const activity = this.activityRecorder.createFromAction(action, xpResult);

      // 4. Record the activity in the database
      const recordedActivity = await this.activityRepository.recordActivity(activity) as GameActionActivity;

      // 5. Update user's progression state
      const progressionUpdate: ProgressionUpdate = {
        xpGained: xpResult.total,
        activityType: action.type,
      };

      const updateResult = await this.stateRepository.updateState(action.userId, progressionUpdate, recordedActivity);

      // 6. Publish events based on state changes
      await this.publishProgressionEvents(action.userId, updateResult, recordedActivity);

      // 7. Mark the game action as processed
      await this.gameActionRepository.markAsProcessed(action.id);

      // 8. Return the action result
      const result = {
        xpGained: xpResult.total,
        level: updateResult.state.level,
        currentLevelProgress: {
          level: updateResult.state.level,
          currentLevelXp: updateResult.state.currentLevelXp,
          xpToNextLevel: updateResult.state.xpToNextLevel,
        },
        leveledUp: updateResult.leveledUp,
      };

      logger.info(`Game action processed successfully`, {
        actionId: id,
        xpGained: result.xpGained,
        newLevel: result.level,
      });

      return result;
    } catch (error) {
      logger.error('Error processing game action', {
        actionId: action.id,
        error: error instanceof Error ? error.message : String(error),
      });

      // Mark action as failed with error details
      await this.gameActionRepository.markAsFailed(action.id, error instanceof Error ? error.message : 'Unknown error');

      throw error;
    }
  }

  /**
   * Update a user's progression directly (not from a game action)
   * @param userId User ID to update
   * @param update The progression update to apply
   * @returns Updated progression state
   */
  async updateProgression(userId: string, update: ProgressionUpdate): Promise<ActionResult> {
    logger.info(`Updating progression for user: ${userId}`, {
      userId,
      xpGained: update.xpGained,
      activityType: update.activityType,
    });

    try {
      // 1. Get or create user's progression state
      let state = await this.stateRepository.getState(userId);
      if (!state) {
        state = await this.stateRepository.createInitialState(userId);
      }

      // 2. Create manual activity if needed
      let activity: GameActionActivity | undefined;
      if (update.activityType) {
        activity = this.activityRecorder.createManualActivity(userId, update);
        await this.activityRepository.recordActivity(activity);
      }

      // 3. Update progression state
      const updateResult = await this.stateRepository.updateState(userId, update, activity);

      // 4. Publish events
      if (activity) {
        await this.publishProgressionEvents(userId, updateResult, activity);
      }

      // 5. Return result
      const result = {
        xpGained: update.xpGained,
        level: updateResult.state.level,
        currentLevelProgress: {
          level: updateResult.state.level,
          currentLevelXp: updateResult.state.currentLevelXp,
          xpToNextLevel: updateResult.state.xpToNextLevel,
        },
        leveledUp: updateResult.leveledUp,
      };

      logger.info(`Progression updated successfully`, {
        userId,
        xpGained: update.xpGained,
        newLevel: result.level,
      });

      return result;
    } catch (error) {
      logger.error('Error updating progression', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get a user's current progression state
   * @param userId User ID to get state for
   * @returns The current progression state
   */
  async getProgressionState(userId: string) {
    return this.stateRepository.getState(userId);
  }

  /**
   * Get recent activities for a user
   * @param userId User ID to get activities for
   * @param limit Maximum number of activities to return
   * @returns Array of recent activities
   */
  async getRecentActivities(userId: string, limit = 10) {
    return this.activityRepository.getRecentActivities(userId, limit);
  }

  /**
   * Publish events based on progression state changes
   * @param userId User ID
   * @param updateResult Result of the state update
   * @param activity The game action activity that caused the update
   */
  private async publishProgressionEvents(userId: string, updateResult: any, activity: GameActionActivity) {
    // 1. Always publish activity recorded event (include state for milestone badge checking)
    await this.eventPublisher.emitActivityRecorded(userId, activity, updateResult.state);

    // 2. Publish XP gained event
    await this.eventPublisher.emitXpGained(userId, activity, updateResult.state, updateResult.previousState);

    // 3. Publish level up event if user leveled up
    if (updateResult.leveledUp) {
      await this.eventPublisher.emitLevelUp(userId, updateResult.state, updateResult.previousState);

      logger.info('User leveled up', {
        userId,
        newLevel: updateResult.state.level,
        previousLevel: updateResult.previousState.level,
      });
    }

    // 4. Publish achievement events if there are new achievements
    if (updateResult.newAchievements && updateResult.newAchievements.length > 0) {
      for (const achievementId of updateResult.newAchievements) {
        await this.eventPublisher.emitAchievementUnlocked(userId, achievementId);
      }
    }
  }
}
