import { Event } from '@codeheroes/event';
import { IssueEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base.handler';
import { ActivityType, IssueActivityData, ActivityMetrics } from '../../types';

export class IssueUpdateHandler extends BaseActivityHandler {
  protected activityType = ActivityType.ISSUE_UPDATED;
  protected eventTypes = ['issues'];
  protected eventActions = ['edited'];

  handle(event: Event): IssueActivityData {
    const details = event.data as IssueEventData;
    return {
      type: 'issue',
      issueNumber: details.issueNumber,
      title: details.title,
      state: details.state,
      stateReason: details.stateReason
    };
  }

  getMetrics(event: Event): ActivityMetrics {
    return {
      updateCount: 1  // Incremental update count
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as IssueEventData;
    return `Updated issue #${details.issueNumber}`;
  }
}