import { CreateEventInput, EventService, logger } from '@codeheroes/common';
import { GitHubWebhookEvent } from '../interfaces/github-webhook-event.interface';
import { ProcessResult } from '../interfaces/process-result.interface';
import { StorageService } from '../storage/storage.service';

export abstract class BaseEventProcessor {
  protected readonly eventService: EventService;
  protected readonly webhookEvent: GitHubWebhookEvent;
  protected readonly storageService: StorageService;

  constructor(webhookEvent: GitHubWebhookEvent) {
    this.eventService = new EventService();
    this.webhookEvent = webhookEvent;
    this.storageService = new StorageService();
  }

  protected abstract processEvent(): Promise<CreateEventInput>;

  private async storeRawEvent(): Promise<void> {
    if (!this.storageService) {
      return;
    }

    try {
      await this.storageService.storeRawRequest(this.webhookEvent);
    } catch (error) {
      logger.error(
        `Failed to store raw event ${this.webhookEvent.eventId}:`,
        error
      );
      // Don't throw - we want to continue processing even if storage fails
    }
  }

  async process(): Promise<ProcessResult> {
    try {
      const existingEvent = await this.eventService.findByEventId(
        this.webhookEvent.eventId
      );
      if (existingEvent) {
        logger.info(`Event ${this.webhookEvent.eventId} already processed`);
        return {
          success: false,
          message: `Event ${this.webhookEvent.eventId} already processed`,
        };
      }

      await this.storeRawEvent();
      const event = await this.processEvent();
      await this.eventService.createEvent(event);
      logger.info('Event created successfully');

      return {
        success: true,
        message: 'Event processed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process event',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
