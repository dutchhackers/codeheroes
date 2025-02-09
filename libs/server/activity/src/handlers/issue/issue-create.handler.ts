import { Event } from '@codeheroes/event';
import { GithubIssueEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base/base.handler';
import { ActivityType, IssueActivityData, ActivityMetrics } from '../../types';

export class IssueCreateHandler extends BaseActivityHandler {
  protected activityType = ActivityType.ISSUE_CREATED;
  protected eventTypes = ['issues'];
  protected eventActions = ['opened'];

  handle(event: Event): IssueActivityData {
    const details = event.data as GithubIssueEventData;
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
    const details = event.data as GithubIssueEventData;
    return `Created issue #${details.issueNumber}: ${details.title}`;
  }
}
