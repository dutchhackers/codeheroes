import { BaseFirestoreService, logger } from '@codeheroes/common';
import { CollectionReference } from 'firebase-admin/firestore';
import { eventConverter } from './event.converter';
import { CreateEventInput } from './event.dto';
import { Event } from './event.model';

export class EventService extends BaseFirestoreService<Event> {
  protected collection: CollectionReference<Event>;

  constructor() {
    super();
    this.collection = this.db.collection('events').withConverter(eventConverter);
  }

  async createEvent(eventData: CreateEventInput): Promise<Event> {
    logger.info('Creating event:', eventData);

    if (!eventData.source?.id || !eventData.provider) {
      throw new Error('Required event fields missing');
    }
    return this.create(eventData);
  }

  async findByEventId(eventId: string): Promise<Event | null> {
    const snapshot = await this.collection.where('externalEventId', '==', eventId).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }
}
