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
        actor: {
          id: payload.sender.id.toString(),
          username: payload.sender.login,
        },
        repository: {
          id: payload.repository.id.toString(),
          name: payload.repository.name,
          owner: payload.repository.owner.login,
        },
        issueNumber: payload.issue.number,
        title: payload.issue.title,
        state: payload.issue.state,
        action: payload.action,
      } as IssueEventDetails,
      eventTimestamp: new Date(payload.issue.updated_at).toISOString(),
    };
  }
}
