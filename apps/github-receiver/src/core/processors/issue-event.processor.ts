import { ConnectedAccountProvider, CreateEventInput } from '@codeheroes/common';
import { IssueEvent } from '../interfaces/github.interface';
import { BaseEventProcessor } from './base-event.processor';
import { IssueEventDetails } from '../interfaces/event-details.interface';

export class IssueEventProcessor extends BaseEventProcessor {
  protected async processEvent(): Promise<CreateEventInput> {
    const payload = this.webhookEvent.payload as IssueEvent;

    return {
      eventId: this.webhookEvent.eventId,
      action: this.webhookEvent.action,
      source: this.webhookEvent.source as ConnectedAccountProvider,
      processed: false,
      details: {
        authorId: payload.sender.id.toString(),
        issueNumber: payload.issue.number,
        title: payload.issue.title,
        state: payload.issue.state,
        action: payload.action,
        repositoryId: payload.repository.id.toString(),
        repositoryName: payload.repository.name,
        repositoryOwner: payload.repository.owner.login,
      } as IssueEventDetails,
      eventTimestamp: new Date(payload.issue.updated_at).toISOString(),
    };
  }
}
