import { ConnectedAccountProvider, CreateEventInput, EventService, logger } from '@codeheroes/common';
import {
  GitHubWebhookEvent,
  IssueEventDetails,
  ProcessResult,
  PullRequestEventDetails,
  PushEventDetails,
} from './interfaces';
import { IssueEvent, PullRequestEvent, PushEvent } from '../../_external/external-github-interfaces';
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

  protected async processEvent(): Promise<CreateEventInput> {
    return {
      eventId: this.webhookEvent.eventId,
      publisher: {
        source: this.webhookEvent.source as ConnectedAccountProvider,
        type: this.webhookEvent.eventType,
      },
      data: this.getEventDetails(),
      eventTimestamp: this.getEventTimestamp(),
    };
  }

  protected abstract getEventDetails(): PushEventDetails | PullRequestEventDetails | IssueEventDetails;
  protected getEventTimestamp(): string {
    const timestamp = this.getPayloadTimestamp();
    return new Date(timestamp || new Date()).toISOString();
  }

  protected abstract getPayloadTimestamp(): string | undefined;

  private async storeRawEvent(): Promise<void> {
    if (!this.storageService) {
      return;
    }

    try {
      await this.storageService.storeRawRequest(this.webhookEvent);
    } catch (error) {
      logger.error(`Failed to store raw event ${this.webhookEvent.eventId}:`, error);
    }
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

export class PushEventProcessor extends BaseEventProcessor {
  protected getEventDetails(): PushEventDetails {
    const payload = this.webhookEvent.payload as PushEvent;
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
      },
      action: this.webhookEvent.action,
      commitCount: payload.commits.length,
      branch: payload.ref,
      lastCommitMessage: payload.head_commit?.message || null,
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }

  protected getPayloadTimestamp(): string | undefined {
    const payload = this.webhookEvent.payload as PushEvent;
    return payload.head_commit?.timestamp;
  }
}

export class PullRequestEventProcessor extends BaseEventProcessor {
  protected getEventDetails(): PullRequestEventDetails {
    const payload = this.webhookEvent.payload as PullRequestEvent;
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
      },
      action: this.webhookEvent.action,
      prNumber: payload.number,
      title: payload.pull_request.title,
      state: payload.pull_request.state,
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }

  protected getPayloadTimestamp(): string | undefined {
    const payload = this.webhookEvent.payload as PullRequestEvent;
    return payload.pull_request.updated_at;
  }
}

export class IssueEventProcessor extends BaseEventProcessor {
  protected getEventDetails(): IssueEventDetails {
    const payload = this.webhookEvent.payload as IssueEvent;
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
      },
      action: this.webhookEvent.action,
      issueNumber: payload.issue.number,
      title: payload.issue.title,
      state: payload.issue.state,
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }

  protected getPayloadTimestamp(): string | undefined {
    const payload = this.webhookEvent.payload as IssueEvent;
    return payload.issue.updated_at;
  }
}
