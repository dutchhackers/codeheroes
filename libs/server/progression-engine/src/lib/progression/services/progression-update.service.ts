import { logger } from '@codeheroes/common';
import { Activity, ProgressionState, ProgressionUpdate } from '@codeheroes/types';
import { getXpProgress } from '../../config/level-thresholds';
import { EventPublisherService } from '../../events/event-publisher.service';
import { ProgressionStateService } from './progression-state.service';

/**
 * Service focused on handling XP and level progression
 */
export class ProgressionUpdateService {
  private eventService: EventPublisherService;
  private stateService: ProgressionStateService;

  constructor() {
    this.eventService = new EventPublisherService();
    this.stateService = new ProgressionStateService();
  }

  /**
   * Update a user's progression with XP gains and potential level-ups
   */
  async updateProgression(userId: string, update: ProgressionUpdate, activity?: Activity): Promise<ProgressionState> {
    logger.info('Starting progression update', { userId, xpGained: update.xpGained });

    // Get current state or create initial if none exists
    let state = await this.stateService.getProgressionState(userId);
    if (!state) {
      state = await this.stateService.createInitialState(userId);
    }

    // Store previous state for events
    const previousState = { ...state };

    // Apply XP gain
    state.xp += update.xpGained;

    // Update progression based on new XP total
    const { currentLevel, currentLevelXp, xpToNextLevel } = getXpProgress(state.xp);

    // Check for level up
    const didLevelUp = currentLevel > previousState.level;

    // Update state values
    state.level = currentLevel;
    state.currentLevelXp = currentLevelXp;
    state.xpToNextLevel = xpToNextLevel;
    state.lastActivityDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Persist the updated state
    await this.stateService.updateProgressionState(state);

    // Emit progression events
    await this.emitProgressionEvents(userId, state, previousState, activity, didLevelUp);

    logger.info('Progression update completed', {
      userId,
      newXp: state.xp,
      newLevel: state.level,
      leveledUp: didLevelUp,
    });

    return state;
  }

  /**
   * Emit the appropriate progression events based on the state changes
   */
  private async emitProgressionEvents(
    userId: string,
    newState: ProgressionState,
    previousState: ProgressionState,
    activity?: Activity,
    didLevelUp?: boolean,
  ): Promise<void> {
    // Emit XP gained event if we have an activity
    if (activity) {
      await this.eventService.emitXpGained(userId, activity, newState, previousState);
    }

    // Emit level up event if the level increased
    if (didLevelUp) {
      await this.eventService.emitLevelUp(userId, newState, previousState);
      logger.info('User leveled up', { userId, newLevel: newState.level });
    }
  }
}
