import { CreateEventInput, EventService } from '@codeheroes/common';

export abstract class BaseEventProcessor<T = unknown> {
  constructor(protected eventService: EventService) {}

  protected abstract processEvent(payload: T): Promise<CreateEventInput>;

  async process(payload: T): Promise<CreateEventInput | null> {
    const eventId = await this.getEventId(payload);
    
    const existingEvent = await this.eventService.findByEventId(eventId);
    if (existingEvent) {
      console.log(`Event ${eventId} already processed`);
      return null;
    }

    return this.processEvent(payload);
  }

  protected abstract getEventId(payload: T): string;
}