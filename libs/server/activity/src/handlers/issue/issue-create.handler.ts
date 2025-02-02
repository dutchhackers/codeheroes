import { Event } from '@codeheroes/event';
import { IssueEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base.handler';
import { ActivityType, IssueActivityData, ActivityMetrics } from '../../types';

export class IssueCreateHandler extends BaseActivityHandler {
  protected activityType = ActivityType.ISSUE_CREATED;
  protected eventTypes = ['issues'];
  protected eventActions = ['opened'];

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
      // charactersCount: (event.data as IssueEventData).title.length + 
      //                 ((event.data as IssueEventData).body?.length || 0)
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as IssueEventData;
    return `Created issue #${details.issueNumber}: ${details.title}`;
  }
}