import { Event } from '@codeheroes/event';
import { GithubIssueEventData } from '@codeheroes/providers';
import { ActivityType } from '@codeheroes/shared/types';
import { IssueActivityData } from '../../types';
import { BaseActivityHandler } from '../base/base.handler';

export class IssueCloseHandler extends BaseActivityHandler {
  protected activityType = ActivityType.ISSUE_CLOSED;
  protected eventTypes = ['issues'];
  protected eventActions = ['closed'];

  handleActivity(event: Event): IssueActivityData {
    const details = event.data as GithubIssueEventData;
    return {
      type: 'issue',
      issueNumber: details.issueNumber,
      title: details.title,
      state: 'closed',
      stateReason: details.stateReason,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubIssueEventData;
    return `Closed issue #${details.issueNumber}${details.stateReason ? ` as ${details.stateReason}` : ''}`;
  }
}
