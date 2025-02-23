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

  async createEvent(eventInputData: CreateEventInput, eventData: Record<string, unknown>): Promise<Event> {
    if (!eventInputData.source?.id || !eventInputData.provider) {
      throw new Error('Required event fields missing');
    }

    return this.create({
      ...eventInputData,
      data: eventData,
    });
  }

  async findByEventId(eventId: string): Promise<Event | null> {
    const snapshot = await this.collection.where('source.id', '==', eventId).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }
}
