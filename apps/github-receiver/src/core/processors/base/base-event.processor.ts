import { CreateEventInput, EventService } from '@codeheroes/common';
import { logger } from '@codeheroes/common';
import { GitHubEventAction } from '../../interfaces/github-event-actions.type';

export abstract class BaseEventProcessor<T = unknown, H = unknown> {
  constructor(protected eventService: EventService) {}

  protected abstract processEvent(payload: T, headers?: H): Promise<CreateEventInput>;

  async process(payload: T, headers?: H): Promise<CreateEventInput | null> {
    const eventId = await this.getEventId(payload, headers);
    
    const existingEvent = await this.eventService.findByEventId(eventId);
    if (existingEvent) {
      logger.info(`Event ${eventId} already processed`);
      return null;
    }

    return this.processEvent(payload, headers);
  }

  protected abstract getEventId(payload: T, headers?: H): string;

  protected abstract getAction(payload: T): GitHubEventAction;
}