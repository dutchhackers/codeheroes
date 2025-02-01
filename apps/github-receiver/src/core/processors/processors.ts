import { ConnectedAccountProvider, logger } from '@codeheroes/common';
import { CreateEventInput, EventService } from '@codeheroes/event';
import { GitHubProvider } from '@codeheroes/providers';

import { ParserFactory } from '../parsers/factory';
import { GitHubWebhookEvent, ProcessResult } from './interfaces';

export abstract class BaseEventProcessor {
  protected readonly githubProvider: GitHubProvider;
  protected readonly eventService: EventService;
  protected readonly webhookEvent: GitHubWebhookEvent;

  constructor(webhookEvent: GitHubWebhookEvent) {
    this.githubProvider = new GitHubProvider();
    this.eventService = new EventService();
    this.webhookEvent = webhookEvent;
  }

  protected async generateCreateEventInput(): Promise<CreateEventInput> {
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
      const existingEvent = await this.eventService.findByEventId(this.webhookEvent.eventId);
      if (existingEvent) {
        logger.info(`Event ${this.webhookEvent.eventId} already processed`);
        return {
          success: false,
          message: `Event ${this.webhookEvent.eventId} already processed`,
        };
      }

      const parser = ParserFactory.createParser(this.webhookEvent);
      const eventData = parser.parse(this.webhookEvent.payload);

      const createEventInput = await this.generateCreateEventInput();
      await this.eventService.createEvent(createEventInput, eventData);
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

export class PushEventProcessor extends BaseEventProcessor {}
export class PullRequestEventProcessor extends BaseEventProcessor {}
export class IssueEventProcessor extends BaseEventProcessor {}
export class PullRequestReviewEventProcessor extends BaseEventProcessor {}
export class PullRequestReviewThreadProcessor extends BaseEventProcessor {}
export class PullRequestReviewCommentProcessor extends BaseEventProcessor {}
