import { CollectionReference, getFirestore } from 'firebase-admin/firestore';
import { EventSource } from '../models';
import { CreateEventInput, WebhookEvent } from '../models/event.model';
import { logger } from '../utils';
import { eventConverter } from '../utils/converters.util';
import { BaseFirestoreService } from './base.service';

export class EventService extends BaseFirestoreService<WebhookEvent> {
  protected collection: CollectionReference<WebhookEvent>;

  constructor() {
    super();
    this.collection = getFirestore().collection('events').withConverter(eventConverter);
  }

  async createSimpleEvent(type: string, source: EventSource, data: Record<string, unknown>): Promise<WebhookEvent> {
    logger.info('Creating event:', { type, source, data });

    if (!source.externalEventId || !source.provider) {
      throw new Error('Required event fields missing');
    }

    return this.create({ type, source, data });
  }

  async createEvent(eventData: CreateEventInput): Promise<WebhookEvent> {
    logger.info('Creating event:', eventData);

    if (!eventData.source?.externalEventId || !eventData.source?.provider) {
      throw new Error('Required event fields missing');
    }
    return this.create(eventData);
  }

  async findByEventId(eventId: string): Promise<WebhookEvent | null> {
    const snapshot = await this.collection.where('source.externalEventId', '==', eventId).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }
}
