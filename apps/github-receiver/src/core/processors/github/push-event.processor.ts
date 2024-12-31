import { EventType, CreateEventInput } from '@codeheroes/common';
import { GitHubHeaders, PushEvent } from '../../interfaces/github.interface';
import { BaseEventProcessor } from '../base/base-event.processor';

export class PushEventProcessor extends BaseEventProcessor<PushEvent, GitHubHeaders> {
  protected getEventId(payload: PushEvent, headers?: GitHubHeaders): string {
    return headers?.['x-github-delivery'] || payload.head_commit?.id || '';
  }

  protected async processEvent(payload: PushEvent, headers?: GitHubHeaders): Promise<CreateEventInput> {
    const eventId = this.getEventId(payload, headers);

    return {
      eventId,
      type: EventType.COMMIT,
      source: 'github',
      activityId: `commit-${eventId}`,
      description: `Push to ${payload.repository.name}`,
      details: {
        authorId: payload.sender.id.toString(),
        commitCount: payload.commits.length,
        branch: payload.ref,
        repositoryId: payload.repository.id.toString(),
        repositoryName: payload.repository.name,
      },
      eventTimestamp: new Date(
        payload.head_commit?.timestamp || new Date()
      ).toISOString(),
    };
  }
}
