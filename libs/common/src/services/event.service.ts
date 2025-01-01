import { CollectionReference, getFirestore } from 'firebase-admin/firestore';
import { eventConverter } from '../converters';
import { CreateEventInput } from '../interfaces/event.interface';
import { Event } from '../interfaces';
import { BaseFirestoreService } from './base.service';
import { logger } from '../utils';

export class EventService extends BaseFirestoreService<Event> {
  protected collection: CollectionReference<Event>;

  constructor() {
    super();
    this.collection = getFirestore()
      .collection('events')
      .withConverter(eventConverter);
  }

  async createEvent(eventData: CreateEventInput): Promise<Event> {
    logger.info('Creating event:', eventData);

    if (!eventData.eventId || !eventData.type || !eventData.source) {
      throw new Error('Required event fields missing');
    }
    return this.create(eventData);
  }

  async findByEventId(eventId: string): Promise<Event | null> {
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
