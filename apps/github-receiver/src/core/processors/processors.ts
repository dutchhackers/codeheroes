import {
  ConnectedAccountProvider,
  CreateEventInput,
  EventService,
  EventSource,
  IssueEventDetails,
  PullRequestEventDetails,
  PushEventDetails
} from '@codeheroes/common';
import { IssueEvent, PullRequestEvent, PushEvent } from '../../_external/external-github-interfaces';
import { GitHubWebhookEvent } from './interfaces';

export abstract class BaseEventProcessor {
  protected readonly eventService: EventService;
  protected readonly webhookEvent: GitHubWebhookEvent;

  constructor(webhookEvent: GitHubWebhookEvent) {
    this.eventService = new EventService();
    this.webhookEvent = webhookEvent;
  }

  getEventType(): string {
    return `${this.webhookEvent.source}_${this.webhookEvent.eventType}`;
  }

  getEventSource(): EventSource {
    return {
      provider: this.webhookEvent.source as ConnectedAccountProvider,
      type: this.webhookEvent.eventType,
      externalEventId: this.webhookEvent.eventId,
      externalEventTimestamp: this.getEventTimestamp(),
    };
  }

  protected async processEvent(): Promise<CreateEventInput> {
    return {
      type: this.getEventType(),
      source: this.getEventSource(),
      data: this.getEventData(),
    };
  }

  abstract getEventData(): PushEventDetails | PullRequestEventDetails | IssueEventDetails;
  protected getEventTimestamp(): string {
    const timestamp = this.getPayloadTimestamp();
    return new Date(timestamp || new Date()).toISOString();
  }

  protected abstract getPayloadTimestamp(): string | undefined;
}

export class PushEventProcessor extends BaseEventProcessor {
  getEventData(): PushEventDetails {
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
  getEventData(): PullRequestEventDetails {
    const payload = this.webhookEvent.payload as PullRequestEvent;
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
      },
      action: payload.action,
      prNumber: payload.number,
      title: payload.pull_request.title,
      state: payload.pull_request.state,
      merged: payload.pull_request.merged,
      mergedAt: payload.pull_request.merged_at || undefined,
      mergedBy: payload.pull_request.merged_by ? {
        id: payload.pull_request.merged_by.id.toString(),
        login: payload.pull_request.merged_by.login
      } : undefined,
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
  getEventData(): IssueEventDetails {
    const payload = this.webhookEvent.payload as IssueEvent;
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
      },
      action: payload.action,
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
