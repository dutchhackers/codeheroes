import { Event } from '@codeheroes/event';
import { IssueEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base.handler';
import { ActivityType, IssueActivityData, ActivityMetrics } from '../../types';
import { TimeUtils } from '@codeheroes/common';

export class IssueCloseHandler extends BaseActivityHandler {
  protected activityType = ActivityType.ISSUE_CLOSED;
  protected eventTypes = ['issues'];
  protected eventActions = ['closed'];

  handle(event: Event): IssueActivityData {
    const details = event.data as IssueEventData;
    return {
      type: 'issue',
      issueNumber: details.issueNumber,
      title: details.title,
      state: 'closed',
      stateReason: details.stateReason,
    };
  }

  getMetrics(event: Event): ActivityMetrics {
    const details = event.data as IssueEventData;
    return {
      //   timeToClose: TimeUtils.calculateTimeBetween(details.createdAt, details.closedAt),
      //   commentCount: details.commentCount || 0,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as IssueEventData;
    return `Closed issue #${details.issueNumber}${details.stateReason ? ` as ${details.stateReason}` : ''}`;
  }
}
