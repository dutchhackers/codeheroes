import { PubSub } from '@google-cloud/pubsub';
import { DatabaseInstance, logger } from '@codeheroes/common';
import { Activity } from '../interfaces/activity';
import { ProgressionState } from '../interfaces/progression';

export enum ProgressionEventType {
  XP_GAINED = 'progression.xp.gained',
  LEVEL_UP = 'progression.level.up',
  STREAK_UPDATED = 'progression.streak.updated',
  BADGE_EARNED = 'progression.badge.earned',
  ACTIVITY_RECORDED = 'progression.activity.recorded',
}

export interface ProgressionEvent {
  userId: string;
  timestamp: string;
  type: ProgressionEventType;
  data: {
    activity?: Activity;
    state?: Partial<ProgressionState>;
    previousState?: Partial<ProgressionState>;
    badgeId?: string; // Added to support badge events
  };
}

export class ProgressionEventService {
  private pubsub: PubSub;
  private readonly topicName = 'progression-events';

  constructor() {
    this.pubsub = new PubSub();
  }

  private async ensureTopicExists() {
    try {
      const [topics] = await this.pubsub.getTopics();
      const topicExists = topics.some((topic) => topic.name.endsWith(this.topicName));

      if (!topicExists) {
        await this.pubsub.createTopic(this.topicName);
      }
    } catch (error) {
      logger.error('Error ensuring topic exists:', error);
      throw error;
    }
  }

  async emit(event: ProgressionEvent) {
    try {
      await this.ensureTopicExists();
      const messageData = Buffer.from(JSON.stringify(event));

      await this.pubsub.topic(this.topicName).publish(messageData);

      logger.info('Published event', {
        type: event.type,
        userId: event.userId,
      });
    } catch (error) {
      logger.error('Error emitting event:', error);
      throw error;
    }
  }

  async emitXpGained(userId: string, activity: Activity, state: ProgressionState, previousState: ProgressionState) {
    await this.emit({
      userId,
      timestamp: new Date().toISOString(),
      type: ProgressionEventType.XP_GAINED,
      data: { activity, state, previousState },
    });
  }

  async emitLevelUp(userId: string, state: ProgressionState, previousState: ProgressionState) {
    await this.emit({
      userId,
      timestamp: new Date().toISOString(),
      type: ProgressionEventType.LEVEL_UP,
      data: { state, previousState },
    });
  }

  async emitStreakUpdated(userId: string, state: ProgressionState, previousState: ProgressionState) {
    await this.emit({
      userId,
      timestamp: new Date().toISOString(),
      type: ProgressionEventType.STREAK_UPDATED,
      data: { state, previousState },
    });
  }

  async emitBadgeEarned(userId: string, badgeId: string, state: ProgressionState) {
    await this.emit({
      userId,
      timestamp: new Date().toISOString(),
      type: ProgressionEventType.BADGE_EARNED,
      data: { badgeId, state },
    });
  }

  async emitActivityRecorded(userId: string, activity: Activity) {
    await this.emit({
      userId,
      timestamp: new Date().toISOString(),
      type: ProgressionEventType.ACTIVITY_RECORDED,
      data: { activity },
    });
  }
}
