import { BaseFirestoreService, DatabaseService, logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { CollectionReference } from 'firebase-admin/firestore';
import { activityConverter } from '../types';
import { CreateActivityInput, ActivityQuery, UserActivity } from '../types';
import { ActivityHandlerFactory } from '../factory/activity.factory';

export class ActivityService extends BaseFirestoreService<UserActivity> {
  protected collection: CollectionReference<UserActivity>;
  private databaseService: DatabaseService;

  constructor() {
    super();
    this.databaseService = new DatabaseService();
    this.collection = this.getUserActivitiesCollection('temporary');
  }

  private getUserActivitiesCollection(userId: string): CollectionReference<UserActivity> {
    return this.db.collection('users').doc(userId).collection('activities').withConverter(activityConverter);
  }

  async handleNewEvent(eventId: string, eventData: Event): Promise<void> {
    try {
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

      const handler = ActivityHandlerFactory.getHandler(eventData);
      if (!handler) {
        logger.warn('No handler found for event type', {
          eventId,
          eventType: eventData.source.event,
        });
        return;
      }

      const activityInput: CreateActivityInput = {
        type: handler.getActivityType(),
        eventId,
        userId,
        provider: eventData.provider,
        eventType: eventData.source.event,
        externalEventId: eventData.source.id,
        data: handler.handle(eventData),
        metrics: handler.getMetrics(eventData),
        userFacingDescription: handler.generateDescription(eventData),
      };

      await this.createUserActivity(userId, activityInput);
    } catch (error) {
      logger.error('Failed to handle new event', { eventId, error });
      throw error;
    }
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
      // await this.metricsService.processActivity(activity);

      logger.info('Created new user activity', { userId, activityId: docRef.id });
    } catch (error) {
      logger.error('Failed to create user activity', { userId, error });
      throw error;
    }
  }

  async getUserActivities(query: ActivityQuery): Promise<UserActivity[]> {
    try {
      const { userId, type, category, startDate, endDate, limit = 100 } = query;
      const collection = this.getUserActivitiesCollection(userId);

      let queryRef = collection.orderBy('createdAt', 'desc');

      if (type) {
        queryRef = queryRef.where('type', '==', type);
      }

      if (startDate) {
        queryRef = queryRef.where('createdAt', '>=', startDate);
      }

      if (endDate) {
        queryRef = queryRef.where('createdAt', '<=', endDate);
      }

      const snapshot = await queryRef.limit(limit).get();
      const activities = snapshot.docs.map((doc) => doc.data());

      return category
        ? activities.filter((activity) => ActivityHandlerFactory.getActivityCategory(activity.type) === category)
        : activities;
    } catch (error) {
      logger.error('Failed to get user activities', { query, error });
      throw error;
    }
  }
}
