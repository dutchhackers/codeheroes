import { CreateEventInput } from '@codeheroes/common';
import { PushEvent } from '../../interfaces/github.interface';
import { BaseEventProcessor } from '../base/base-event.processor';

export class PushEventProcessor extends BaseEventProcessor<PushEvent> {
  protected getEventId(payload: PushEvent): string {
    return payload.head_commit?.id || '';
  }

  protected async processEvent(payload: PushEvent): Promise<CreateEventInput> {
    return {
      eventId: this.getEventId(payload),
      type: 'push',
      source: 'github',
      description: `Push to ${payload.repository.name}`,
      details: {
        authorId: payload.sender.id.toString(),
        commitCount: payload.commits.length,
        branch: payload.ref,
        repositoryId: payload.repository.id.toString(),
        repositoryName: payload.repository.name,
      },
      activityId: this.getEventId(payload),
      eventTimestamp: new Date(
        payload.head_commit?.timestamp || new Date()
      ).toISOString(),
    };
  }
}
