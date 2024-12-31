import { EventType, CreateEventInput } from '@codeheroes/common';
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
    headers?: GitHubHeaders
  ): Promise<CreateEventInput> {
    const eventId = this.getEventId(payload, headers);
    const activityType = this.getActivityType(payload.action, payload);

    return {
      eventId,
      type: activityType,
      source: 'github',
      activityId: `pr-${payload.pull_request.id}`,
      description: `${payload.action} pull request #${payload.number} in ${payload.repository.name}`,
      details: {
        authorId: payload.sender.id.toString(),
        pullRequestNumber: payload.number,
        action: payload.action,
        title: payload.pull_request.title,
        repositoryId: payload.repository.id.toString(),
        repositoryName: payload.repository.name,
        state: payload.pull_request.state,
        draft: payload.pull_request.draft,
      },
      eventTimestamp: new Date(payload.pull_request.updated_at).toISOString(),
    };
  }
  private getActivityType(
    action: PullRequestEvent['action'],
    payload: PullRequestEvent
  ): EventType {
    if (action === 'opened') {
      return EventType.PULL_REQUEST_OPENED;
    }
    if (action === 'closed' && payload.pull_request.merged) {
      return EventType.PULL_REQUEST_MERGED;
    }
    // For actions like 'edited', 'reopened', 'synchronize', etc.
    return EventType.PULL_REQUEST_REVIEWED;
  }
}
