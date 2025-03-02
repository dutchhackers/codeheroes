import { logger } from '@codeheroes/common';
import { CreateEventInput, EventService } from '@codeheroes/event';
import { GitHubWebhookEvent, ProcessResult } from './interfaces';
import { ConnectedAccountProvider } from '@codeheroes/types';

export class EventProcessor {
  private readonly eventService: EventService;

  constructor(private readonly webhookEvent: GitHubWebhookEvent) {
    this.eventService = new EventService();
  }

  private async generateCreateEventInput(): Promise<CreateEventInput> {
    return {
      provider: this.webhookEvent.provider as ConnectedAccountProvider,
      source: {
        id: this.webhookEvent.eventId,
        event: this.webhookEvent.eventType,
      },
    };
  }

  async process(): Promise<ProcessResult> {
    try {
      // Check for duplicate events
      const existingEvent = await this.eventService.findByEventId(this.webhookEvent.eventId);
      if (existingEvent) {
        logger.info(`Event ${this.webhookEvent.eventId} already processed`);
        return {
          success: false,
          message: `Event ${this.webhookEvent.eventId} already processed`,
          event: existingEvent,
        };
      }

      // Create and store the event
      const createEventInput = await this.generateCreateEventInput();
      const newEvent = await this.eventService.createEvent(createEventInput, {});

      logger.info(`Successfully processed ${this.webhookEvent.eventType} event`);
      return {
        success: true,
        message: 'Event processed successfully',
        event: newEvent,
      };
    } catch (error) {
      logger.error('Failed to process event:', error);
      return {
        success: false,
        message: 'Failed to process event',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
