import {
  ConnectedAccountProvider,
  CreateEventInput,
  EventService,
  IssueEventData,
  logger,
  PullRequestEventData,
  PushEventData,
  StorageService,
} from '@codeheroes/common';
import { IssueEvent, PullRequestEvent, PushEvent } from '@shared/github-interfaces';
import { GitHubStorageUtils } from '../utils/github-storage.utils';
import { GitHubWebhookEvent, ProcessResult } from './interfaces';
import { TimeUtils } from '../utils/time.utils';

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
      type: `${this.webhookEvent.provider}_${this.webhookEvent.eventType}`,
      provider: this.webhookEvent.provider as ConnectedAccountProvider,
      source: {
        id: this.webhookEvent.eventId,
        timestamp: this.getEventTimestamp(),
        event: this.webhookEvent.eventType,
      },
      data: this.getEventData(),
    };
  }

  protected abstract getEventData(): PushEventData | PullRequestEventData | IssueEventData;
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
      await GitHubStorageUtils.storeGitHubEvent(this.storageService, this.webhookEvent);
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
  protected getEventData(): PushEventData {
    const payload = this.webhookEvent.payload as PushEvent;
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      metrics: {
        commits: payload.commits.length,
      },
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
  protected getEventData(): PullRequestEventData {
    const payload = this.webhookEvent.payload as PullRequestEvent;
    const { pull_request } = payload;

    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      action: payload.action,
      prNumber: payload.number,
      title: payload.pull_request.title,
      state: payload.pull_request.state,
      merged: payload.pull_request.merged || false,
      ...(payload.pull_request.merged_at && {
        mergedAt: payload.pull_request.merged_at,
        mergedBy: {
          id: payload.pull_request.merged_by!.id.toString(),
          login: payload.pull_request.merged_by!.login,
        },
      }),
      metrics: {
        commits: pull_request.commits,
        additions: pull_request.additions,
        deletions: pull_request.deletions,
        changedFiles: pull_request.changed_files,
        timeInvested: TimeUtils.calculateTimeBetween(pull_request.created_at, pull_request.updated_at),
      },
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
  protected getEventData(): IssueEventData {
    const payload = this.webhookEvent.payload as IssueEvent;
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      action: payload.action,
      issueNumber: payload.issue.number,
      title: payload.issue.title,
      state: payload.issue.state,
      stateReason: payload.issue.state_reason || null,
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
