import { CollectionReference, getFirestore } from 'firebase-admin/firestore';
import { EventSource } from '../models';
import { CreateEventInput, Event } from '../models/event.model';
import { logger } from '../utils';
import { eventConverter } from '../utils/converters.util';
import { BaseFirestoreService } from './base.service';

export class EventService extends BaseFirestoreService<Event> {
  protected collection: CollectionReference<Event>;

  constructor() {
    super();
    this.collection = getFirestore().collection('events').withConverter(eventConverter);
  }

  async createEvent(type: string, source: EventSource, data: Record<string, unknown>): Promise<Event> {
    logger.info('Creating event:', { type, source, data });

    if (!source.externalEventId || !source.provider) {
      throw new Error('Required event fields missing');
    }

    return this.create({ type, source, data });
  }


  async findByEventId(eventId: string): Promise<Event | null> {
    const snapshot = await this.collection.where('source.externalEventId', '==', eventId).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }

  async createIfNotExists(eventData: CreateEventInput): Promise<Event> {
    const existing = await this.findByEventId(eventData.source.externalEventId);
    
    if (existing) {
      const message = `Event ${eventData.source.externalEventId} already processed`;
      logger.info(message);
      throw new Error(message);
    }

    return this.create(eventData);
  }
}
