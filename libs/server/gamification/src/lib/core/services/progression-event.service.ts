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
    logger.info('ProgressionEventService initialized');
  }

  private async ensureTopicExists() {
    try {
      logger.info(`Checking if topic ${this.topicName} exists...`);
      const [topics] = await this.pubsub.getTopics();
      const topicExists = topics.some((topic) => topic.name.endsWith(this.topicName));

      if (!topicExists) {
        logger.info(`Creating new topic: ${this.topicName}`);
        await this.pubsub.createTopic(this.topicName);
        logger.info(`Topic ${this.topicName} created successfully`);
      } else {
        logger.info(`Topic ${this.topicName} already exists`);
      }
    } catch (error) {
      logger.error('Error ensuring topic exists:', {
        error,
        topicName: this.topicName,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async emit(event: ProgressionEvent) {
    try {
      logger.info('Preparing to emit event', {
        type: event.type,
        userId: event.userId,
        timestamp: event.timestamp,
      });

      await this.ensureTopicExists();
      const messageData = Buffer.from(JSON.stringify(event));

      logger.debug('Publishing message to PubSub', {
        topic: this.topicName,
        eventType: event.type,
        dataSize: messageData.length,
      });

      const messageId = await this.pubsub.topic(this.topicName).publish(messageData);

      logger.info('Successfully published event', {
        type: event.type,
        userId: event.userId,
        messageId,
      });
    } catch (error) {
      logger.error('Error emitting event:', {
        error,
        eventType: event.type,
        userId: event.userId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
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
