import { CreateEventInput } from '@codeheroes/common';
import { GitHubEventAction } from '../../interfaces/github-event-actions.type';
import { GitHubHeaders, IssueEvent } from '../../interfaces/github.interface';
import { BaseEventProcessor } from '../base/base-event.processor';

export class IssueEventProcessor extends BaseEventProcessor<
  IssueEvent,
  GitHubHeaders
> {
  protected getEventId(payload: IssueEvent, headers?: GitHubHeaders): string {
    return headers?.['x-github-delivery'] || `issue-${payload.issue.id}`;
  }

  protected async processEvent(
    payload: IssueEvent,
    headers?: GitHubHeaders
  ): Promise<CreateEventInput> {
    const eventId = this.getEventId(payload, headers);

    return {
      eventId,
      action: this.getAction(payload),
      source: 'github',
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
      },
      eventTimestamp: new Date(payload.issue.updated_at).toISOString(),
    };
  }

  protected getAction(payload: IssueEvent): GitHubEventAction {
    switch (payload.action) {
      case 'opened':
        return 'github.issue.opened';
      case 'closed':
        return 'github.issue.closed';
      case 'edited':
      case 'reopened':
      default:
        return 'github.issue.updated';
    }
  }
}
