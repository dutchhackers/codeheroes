import { CreateEventInput } from '@codeheroes/common';
import { GitHubEventAction } from '../../interfaces/github-event-actions.type';
import {
  GitHubHeaders,
  PullRequestEvent,
} from '../../interfaces/github.interface';
import { BaseEventProcessor } from '../base/base-event.processor';

export class PullRequestEventProcessor extends BaseEventProcessor<
  PullRequestEvent,
  GitHubHeaders
> {
  protected getEventId(
    payload: PullRequestEvent,
    headers?: GitHubHeaders
  ): string {
    return headers?.['x-github-delivery'] || `pr-${payload.pull_request.id}`;
  }

  protected async processEvent(
    payload: PullRequestEvent,
    headers?: GitHubHeaders,
    action?: GitHubEventAction
  ): Promise<CreateEventInput> {
    const eventId = this.getEventId(payload, headers);

    return {
      eventId,
      action,
      source: 'github',
      processed: false,
      details: {
        authorId: payload.sender.id.toString(),
        pullRequestNumber: payload.number,
        action: payload.action,
        title: payload.pull_request.title,
        repositoryId: payload.repository.id.toString(),
        repositoryName: payload.repository.name,
        repositoryOwner: payload.repository.owner.login,
        state: payload.pull_request.state,
        draft: payload.pull_request.draft,
      },
      eventTimestamp: new Date(payload.pull_request.updated_at).toISOString(),
    };
  }
}
