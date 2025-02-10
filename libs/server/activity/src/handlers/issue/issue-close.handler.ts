import { Event } from '@codeheroes/event';
import { GithubIssueEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base/base.handler';
import { ActivityType, IssueActivityData, ActivityMetrics } from '../../types';
import { TimeUtils } from '@codeheroes/common';

export class IssueCloseHandler extends BaseActivityHandler {
  protected activityType = ActivityType.ISSUE_CLOSED;
  protected eventTypes = ['issues'];
  protected eventActions = ['closed'];

  handle(event: Event): IssueActivityData {
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
