import { ConnectedAccountProvider, logger } from '@codeheroes/common';
import { CreateEventInput, EventService } from '@codeheroes/event';
import { ParserFactory } from '../parsers/factory';
import { GitHubWebhookEvent, ProcessResult } from './interfaces';

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
        };
      }

      // Parse the event data using appropriate parser
      const parser = ParserFactory.createParser(this.webhookEvent);
      const eventData = parser.parse(this.webhookEvent.payload);

      // If parser returns null, skip processing this event
      if (eventData === null) {
        logger.info(`Skipping event ${this.webhookEvent.eventId} as per parser rules`);
        return {
          success: true,
          message: 'Event skipped as per parser rules',
        };
      }

      // Create and store the event
      const createEventInput = await this.generateCreateEventInput();
      await this.eventService.createEvent(createEventInput, eventData);

      logger.info(`Successfully processed ${this.webhookEvent.eventType} event`);
      return {
        success: true,
        message: 'Event processed successfully',
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
