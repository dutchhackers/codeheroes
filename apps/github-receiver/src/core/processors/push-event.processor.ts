import { ConnectedAccountProvider, CreateEventInput } from '@codeheroes/common';
import { PushEvent } from '../interfaces/github.interface';
import { BaseEventProcessor } from './base-event.processor';
import { PushEventDetails } from '../interfaces/event-details.interface';

export class PushEventProcessor extends BaseEventProcessor {
  protected async processEvent(): Promise<CreateEventInput> {
    const payload = this.webhookEvent.payload as PushEvent;

    return {
      eventId: this.webhookEvent.eventId,
      action: this.webhookEvent.action,
      source: this.webhookEvent.source as ConnectedAccountProvider,
      processed: false,
      details: {
        repository: {
          id: payload.repository.id.toString(),
          name: payload.repository.name,
          owner: payload.repository.owner.login,
        },
        commitCount: payload.commits.length,
        branch: payload.ref,
        lastCommitMessage: payload.head_commit?.message || null,
      } as PushEventDetails,
      eventTimestamp: new Date(
        payload.head_commit?.timestamp || new Date()
      ).toISOString(),
    };
  }
}
