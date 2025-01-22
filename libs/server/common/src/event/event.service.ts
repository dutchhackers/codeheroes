import { CollectionReference, getFirestore } from 'firebase-admin/firestore';
import { BaseFirestoreService } from '../core/services/base.service';
import { logger } from '../firebase';
import { eventConverter } from './event.converter';
import { CreateEventInput } from './event.dto';
import { WebhookEvent } from './event.model';

export class EventService extends BaseFirestoreService<WebhookEvent> {
  protected collection: CollectionReference<WebhookEvent>;

  constructor() {
    super();
    this.collection = getFirestore().collection('events').withConverter(eventConverter);
  }

  async createEvent(eventData: CreateEventInput): Promise<WebhookEvent> {
    logger.info('Creating event:', eventData);

    if (!eventData.externalId || !eventData.provider) {
      throw new Error('Required event fields missing');
    }
    return this.create(eventData);
  }

  async findByEventId(eventId: string): Promise<WebhookEvent | null> {
    const snapshot = await this.collection.where('externalEventId', '==', eventId).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }
}
