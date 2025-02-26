import { ActivityNotInUse as Activity, ProgressionState } from '@codeheroes/shared/types';
import { PubSub } from '@google-cloud/pubsub';

export enum ProgressionEventType {
  XP_GAINED = 'progression.xp.gained',
  LEVEL_UP = 'progression.level.up',
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
    badgeId?: string;
  };
}

export class ProgressionEventService {
  private pubsub: PubSub;
  private readonly topicName = 'progression-events';

  constructor() {
    this.pubsub = new PubSub();
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

  private async emit(event: ProgressionEvent): Promise<void> {
    const topic = this.pubsub.topic(this.topicName);
    const data = Buffer.from(JSON.stringify(event));

    try {
      await topic.publish(data);
    } catch (error) {
      console.error('Error publishing progression event:', error);
      throw error;
    }
  }
}
