import { ConnectedAccountProvider, CreateEventInput } from '@codeheroes/common';
import { PullRequestEvent } from '../interfaces/github.interface';
import { BaseEventProcessor } from './base-event.processor';
import { PullRequestEventDetails } from '../interfaces/event-details.interface';

export class PullRequestEventProcessor extends BaseEventProcessor {
  protected async processEvent(): Promise<CreateEventInput> {
    const payload = this.webhookEvent.payload as PullRequestEvent;

    return {
      eventId: this.webhookEvent.eventId,
      action: this.webhookEvent.action,
      source: this.webhookEvent.source as ConnectedAccountProvider,
      processed: false,
      details: {
        authorId: payload.sender.id.toString(),
        prNumber: payload.number,
        title: payload.pull_request.title,
        repositoryId: payload.repository.id.toString(),
        repositoryName: payload.repository.name,
        repositoryOwner: payload.repository.owner.login,
        state: payload.pull_request.state,
      } as PullRequestEventDetails,
      eventTimestamp: new Date(payload.pull_request.updated_at).toISOString(),
    };
  }
}
