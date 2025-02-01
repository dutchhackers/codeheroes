import { BaseFirestoreService, DatabaseService, logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { CollectionReference } from 'firebase-admin/firestore';
import { activityConverter } from './activity.converter';
import { CreateActivityInput } from './activity.dto';
import { UserActivity } from './activity.model';
import { ActivityUtils } from './activity.util';

export class ActivityService extends BaseFirestoreService<UserActivity> {
  protected collection: CollectionReference<UserActivity>;
  private databaseService: DatabaseService;

  constructor() {
    super();
    this.databaseService = new DatabaseService();
    // Set a temporary collection to satisfy the abstract class requirement
    this.collection = this.getUserActivitiesCollection('temporary');
  }

  private getUserActivitiesCollection(userId: string): CollectionReference<UserActivity> {
    return this.db.collection('users').doc(userId).collection('activities').withConverter(activityConverter);
  }

  async handleNewEvent(eventId: string, eventData: Event): Promise<void> {
    const userId = await this.databaseService.lookupUserId({
      sender: (eventData.data as any)?.sender,
      repository: (eventData.data as any)?.repository,
    });

    if (!userId) {
      logger.warn('Skipping activity creation - no matching user found', {
        eventId,
        eventType: eventData.source.event,
      });
      return;
    }

    const activityInput: CreateActivityInput = {
      type: ActivityUtils.mapToActivityType(eventData),
      eventId,
      userId,
      provider: eventData.provider,
      eventType: eventData.source.event,
      externalEventId: eventData.source.id,
      metadata: ActivityUtils.extractActivityData(eventData),
      //userFacingDescription: '', // TODO: for later // EventUtils.generateUserFacingDescription(eventData),
    };

    await this.createUserActivity(userId, activityInput);
  }

  private async createUserActivity(userId: string, activityInput: CreateActivityInput): Promise<void> {
    try {
      const collection = this.getUserActivitiesCollection(userId);
      const docRef = collection.doc();
      const timestamps = this.createTimestamps();

      const activity = {
        id: docRef.id,
        ...activityInput,
        ...timestamps,
      } as UserActivity;

      await docRef.set(activity);
      logger.info('Created new user activity', { userId, activityId: docRef.id });
    } catch (error) {
      logger.error('Failed to create user activity', error);
      throw error;
    }
  }

  async getUserActivities(userId: string): Promise<UserActivity[]> {
    try {
      const collection = this.getUserActivitiesCollection(userId);
      const snapshot = await collection.orderBy('createdAt', 'desc').limit(100).get();

      return snapshot.docs.map((doc) => doc.data());
    } catch (error) {
      logger.error('Failed to get user activities', { userId, error });
      throw error;
    }
  }
}
