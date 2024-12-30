import { CollectionReference, getFirestore } from 'firebase-admin/firestore';
import { eventConverter } from '../converters';
import { CreateEventInput } from '../interfaces/event.interface';
import { Event } from '../interfaces';
import { BaseFirestoreService } from './base.service';

export class EventService extends BaseFirestoreService<Event> {
  protected collection: CollectionReference<Event>;

  constructor() {
    super();
    this.collection = getFirestore()
      .collection('events')
      .withConverter(eventConverter);
  }

  async createEvent(eventData: CreateEventInput): Promise<Event> {
    if (!eventData.eventId || !eventData.type || !eventData.source) {
      throw new Error('Required event fields missing');
    }
    return this.create(eventData);
  }
}
