import { CreateEventInput, EventService } from '@codeheroes/common';
import { logger } from '@codeheroes/common';
import { GitHubEventAction } from '../../interfaces/github-event-actions.type';

export abstract class BaseEventProcessor<T = unknown, H = unknown> {
  constructor(protected eventService: EventService) {}

  protected abstract processEvent(payload: T, headers?: H): Promise<CreateEventInput>;

  async process(payload: T, headers?: H, action?: GitHubEventAction): Promise<CreateEventInput | null> {
    const eventId = await this.getEventId(payload, headers);
    
    const existingEvent = await this.eventService.findByEventId(eventId);
    if (existingEvent) {
      logger.info(`Event ${eventId} already processed`);
      return null;
    }

    const event = await this.processEvent(payload, headers);
    if (action) {
      event.action = action;
    }
    return event;
  }

  protected abstract getEventId(payload: T, headers?: H): string;
}