import { CreateEventInput, EventService } from '@codeheroes/common';
import { logger } from '@codeheroes/common';
import { GitHubWebhookEvent } from '../../interfaces/github-webhook-event.interface';

export abstract class BaseEventProcessor {
  protected readonly eventService: EventService;
  protected readonly webhookEvent: GitHubWebhookEvent;

  constructor(webhookEvent: GitHubWebhookEvent) {
    this.eventService = new EventService();
    this.webhookEvent = webhookEvent;
  }

  protected abstract processEvent(): Promise<CreateEventInput>;

  async process(): Promise<boolean> {
    const existingEvent = await this.eventService.findByEventId(this.webhookEvent.eventId);
    if (existingEvent) {
      logger.info(`Event ${this.webhookEvent.eventId} already processed`);
      return false;
    }

    const event = await this.processEvent();
    await this.eventService.createEvent(event);
    logger.info('Event created successfully');
    return true;
  }
}