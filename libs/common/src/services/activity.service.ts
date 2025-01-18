import { CollectionReference, getFirestore } from 'firebase-admin/firestore';
import { BaseFirestoreService } from './base.service';
import { CreateActivityInput, UserActivity } from '../models/user.model';
import { WebhookEvent } from '../models/event.model';
import { DatabaseService } from './database.service';
import { logger } from '../utils';
import { activityConverter } from '../utils/converters.util';
import { EventUtils } from '../utils/event.utils';

export class ActivityService extends BaseFirestoreService<UserActivity> {
  protected collection: CollectionReference<UserActivity>;
  private databaseService: DatabaseService;

  constructor() {
    super();
    this.collection = getFirestore()
      .collection('activities')
      .withConverter(activityConverter);
    this.databaseService = new DatabaseService();
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
      userFacingDescription: EventUtils.generateUserFacingDescription(eventData)
    };

    await this.createActivity(activityInput);
  }

  private async createActivity(activityInput: CreateActivityInput): Promise<void> {
    try {
      await this.create(activityInput);
      logger.info('Created new user activity', { userId: activityInput.userId });
    } catch (error) {
      logger.error('Failed to create user activity', error);
      throw error;
    }
  }
}
