import { EventType, CreateEventInput } from '@codeheroes/common';
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
    const activityType = this.getActivityType(payload.action);

    return {
      eventId,
      activityType,
      action: this.formatAction('issue', payload.action),
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

  private getActivityType(action: IssueEvent['action']): EventType {
    switch (action) {
      case 'opened':
        return EventType.ISSUE_OPENED;
      case 'closed':
        return EventType.ISSUE_CLOSED;
      case 'edited':
      case 'reopened':
        return EventType.ISSUE_UPDATED;
      default:
        return EventType.ISSUE_UPDATED;
    }
  }
}
