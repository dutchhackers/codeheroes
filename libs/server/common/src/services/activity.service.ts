import { CollectionReference, getFirestore } from 'firebase-admin/firestore';
import { WebhookEvent } from '../models/event.model';
import { CreateActivityInput, UserActivity } from '../models/user.model';
import { logger } from '../utils';
import { activityConverter } from '../utils/converters.util';
import { EventUtils } from '../utils/event.utils';
import { BaseFirestoreService } from './base.service';
import { DatabaseService } from './database.service';

export class ActivityService extends BaseFirestoreService<UserActivity> {
  protected collection: CollectionReference<UserActivity>; // This will be set per user
  private databaseService: DatabaseService;
  private db: FirebaseFirestore.Firestore;

  constructor() {
    super();
    this.db = getFirestore();
    this.databaseService = new DatabaseService();
    // Set a temporary collection to satisfy the abstract class requirement
    this.collection = this.getUserActivitiesCollection('temporary');
  }

  private getUserActivitiesCollection(userId: string): CollectionReference<UserActivity> {
    return this.db.collection('users').doc(userId).collection('activities').withConverter(activityConverter);
  }

  async handleNewEvent(eventId: string, eventData: WebhookEvent): Promise<void> {
    const userId = await this.databaseService.lookupUserId({
      sender: (eventData.data as any)?.sender,
      repository: (eventData.data as any)?.repository,
    });

    if (!userId) {
      logger.warn('Skipping activity creation - no matching user found', {
        eventId,
        eventType: eventData.source.type,
      });
      return;
    }

    const activityInput: CreateActivityInput = {
      type: EventUtils.mapToActivityType(eventData),
      eventId,
      userId,
      eventSource: eventData.source,
      metadata: EventUtils.extractActivityData(eventData),
      userFacingDescription: EventUtils.generateUserFacingDescription(eventData),
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
