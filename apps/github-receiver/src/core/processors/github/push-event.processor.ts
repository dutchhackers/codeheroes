import { CreateEventInput } from '@codeheroes/common';
import { GitHubHeaders, PushEvent } from '../../interfaces/github.interface';
import { BaseEventProcessor } from '../base/base-event.processor';
import { GitHubEventAction } from '../../interfaces/github-event-actions.type';

export class PushEventProcessor extends BaseEventProcessor<PushEvent, GitHubHeaders> {
  protected getEventId(payload: PushEvent, headers?: GitHubHeaders): string {
    return headers?.['x-github-delivery'] || payload.head_commit?.id || '';
  }

  protected async processEvent(payload: PushEvent, headers?: GitHubHeaders): Promise<CreateEventInput> {
    const eventId = this.getEventId(payload, headers);

    return {
      eventId,
      action: this.getAction(payload),
      source: 'github',
      processed: false,
      details: {
        authorId: payload.sender.id.toString(),
        commitCount: payload.commits.length,
        branch: payload.ref,
        repositoryId: payload.repository.id.toString(),
        repositoryName: payload.repository.name,
        repositoryOwner: payload.repository.owner.login,
        lastCommitMessage: payload.head_commit?.message || null,
      },
      eventTimestamp: new Date(
        payload.head_commit?.timestamp || new Date()
      ).toISOString(),
    };
  }

  protected getAction(payload: PushEvent): GitHubEventAction {
    return 'github.push';
  }
}
