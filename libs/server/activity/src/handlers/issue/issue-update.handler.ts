import { Event } from '@codeheroes/event';
import { GithubIssueEventData } from '@codeheroes/providers';
import { ActivityType } from '@codeheroes/types';
import { IssueActivityData } from '../../types';
import { BaseActivityHandler } from '../base/base.handler';

export class IssueUpdateHandler extends BaseActivityHandler {
  protected activityType = ActivityType.ISSUE_UPDATED;
  protected eventTypes = ['issues'];
  protected eventActions = ['edited'];

  handleActivity(event: Event): IssueActivityData {
    const details = event.data as GithubIssueEventData;
    return {
      type: 'issue',
      issueNumber: details.issueNumber,
      title: details.title,
      state: details.state,
      stateReason: details.stateReason,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubIssueEventData;
    return `Updated issue #${details.issueNumber}`;
  }
}
