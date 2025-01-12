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
      action: this.webhookEvent.action,
      source: this.webhookEvent.source as ConnectedAccountProvider,
      processed: false,
      actor: {
        id: this.webhookEvent.actor.id,
        username: this.webhookEvent.actor.username || '',
      },
      details: await this.getEventDetails(),
      eventTimestamp: await this.getEventTimestamp(),
    };
  }

  protected abstract getEventDetails(): Promise<PushEventDetails | PullRequestEventDetails | IssueEventDetails>;
  protected abstract getEventTimestamp(): Promise<string>;

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
  protected async getEventDetails(): Promise<PushEventDetails> {
    const payload = this.webhookEvent.payload as PushEvent;
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
      },
      commitCount: payload.commits.length,
      branch: payload.ref,
      lastCommitMessage: payload.head_commit?.message || null,
    };
  }

  protected async getEventTimestamp(): Promise<string> {
    const payload = this.webhookEvent.payload as PushEvent;
    return new Date(payload.head_commit?.timestamp || new Date()).toISOString();
  }
}

export class PullRequestEventProcessor extends BaseEventProcessor {
  protected async getEventDetails(): Promise<PullRequestEventDetails> {
    const payload = this.webhookEvent.payload as PullRequestEvent;
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
      },
      prNumber: payload.number,
      title: payload.pull_request.title,
      state: payload.pull_request.state,
    };
  }

  protected async getEventTimestamp(): Promise<string> {
    const payload = this.webhookEvent.payload as PullRequestEvent;
    return new Date(payload.pull_request.updated_at).toISOString();
  }
}

export class IssueEventProcessor extends BaseEventProcessor {
  protected async getEventDetails(): Promise<IssueEventDetails> {
    const payload = this.webhookEvent.payload as IssueEvent;
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
      },
      issueNumber: payload.issue.number,
      title: payload.issue.title,
      state: payload.issue.state,
      action: payload.action,
    };
  }

  protected async getEventTimestamp(): Promise<string> {
    const payload = this.webhookEvent.payload as IssueEvent;
    return new Date(payload.issue.updated_at).toISOString();
  }
}
