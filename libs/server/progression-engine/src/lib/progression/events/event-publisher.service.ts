import { logger } from '@codeheroes/common';
import { GameActionActivity, ProgressionEvent, ProgressionEventType, ProgressionState } from '@codeheroes/types';
import { PubSub } from '@google-cloud/pubsub';

/**
 * Service responsible for publishing progression events to Pub/Sub
 */
export class EventPublisherService {
  private pubsub: PubSub;
  private readonly topicName = 'progression-events';

  constructor() {
    this.pubsub = new PubSub();
  }

  /**
   * Emit an XP gained event
   * @param userId User ID who gained XP
   * @param activity Activity that generated the XP
   * @param state Current progression state
   * @param previousState Previous progression state
   */
  async emitXpGained(
    userId: string,
    activity: GameActionActivity,
    state: ProgressionState,
    previousState: ProgressionState,
  ): Promise<void> {
    await this.emit({
      userId,
      timestamp: new Date().toISOString(),
      type: ProgressionEventType.XP_GAINED,
      data: {
        activity,
        state,
        previousState,
        xpGained: activity.xp.earned,
      },
    });

    logger.debug('XP gained event published', {
      userId,
      xpGained: activity.xp.earned,
    });
  }

  /**
   * Emit a level up event
   * @param userId User ID who leveled up
   * @param state Current progression state
   * @param previousState Previous progression state
   */
  async emitLevelUp(userId: string, state: ProgressionState, previousState: ProgressionState): Promise<void> {
    await this.emit({
      userId,
      timestamp: new Date().toISOString(),
      type: ProgressionEventType.LEVEL_UP,
      data: {
        state,
        previousState,
        previousLevel: previousState.level,
        newLevel: state.level,
      },
    });

    logger.info('Level up event published', {
      userId,
      previousLevel: previousState.level,
      newLevel: state.level,
    });
  }

  /**
   * Emit an activity recorded event
   * @param userId User ID whose activity was recorded
   * @param activity The recorded activity (game action activities only)
   * @param state Current progression state (includes counters for milestone checking)
   */
  async emitActivityRecorded(userId: string, activity: GameActionActivity, state: ProgressionState): Promise<void> {
    await this.emit({
      userId,
      timestamp: new Date().toISOString(),
      type: ProgressionEventType.ACTIVITY_RECORDED,
      data: {
        activity,
        state,
      },
    });

    logger.debug('Activity recorded event published', {
      userId,
      activityId: activity.id,
      activityType: activity.sourceActionType,
    });
  }

  /**
   * Emit a progression event to Pub/Sub
   * @param event Progression event to publish
   */
  private async emit(event: ProgressionEvent): Promise<void> {
    try {
      const topic = this.pubsub.topic(this.topicName);
      const data = Buffer.from(JSON.stringify(event));
      await topic.publish(data);
    } catch (error) {
      logger.error('Error publishing progression event', {
        eventType: event.type,
        userId: event.userId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Don't throw the error to prevent blocking the main flow
      // Just log it and continue
    }
  }
}
