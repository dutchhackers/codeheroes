import { CollectionReference, getFirestore } from 'firebase-admin/firestore';
import { eventConverter } from '../utils/converters.util';
import { CreateEventInput, WebhookEvent } from '../models/event.model';
import { BaseFirestoreService } from './base.service';
import { logger } from '../utils';

export class EventService extends BaseFirestoreService<WebhookEvent> {
  protected collection: CollectionReference<WebhookEvent>;

  constructor() {
    super();
    this.collection = getFirestore()
      .collection('events')
      .withConverter(eventConverter);
  }

  async createEvent(eventData: CreateEventInput): Promise<WebhookEvent> {
    logger.info('Creating event:', eventData);

    if (!eventData.eventId || !eventData.source) {
      throw new Error('Required event fields missing');
    }
    return this.create(eventData);
  }

  async findByEventId(eventId: string): Promise<WebhookEvent | null> {
    const snapshot = await this.collection
      .where('eventId', '==', eventId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }
}
