import { Event } from '@codeheroes/event';
import { GithubIssueEventData } from '@codeheroes/providers';
import { ActivityType } from '@codeheroes/shared/types';
import { IssueActivityData } from '../../types';
import { BaseActivityHandler } from '../base/base.handler';

export class IssueCreateHandler extends BaseActivityHandler {
  protected activityType = ActivityType.ISSUE_CREATED;
  protected eventTypes = ['issues'];
  protected eventActions = ['opened'];

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
    return `Created issue #${details.issueNumber}: ${details.title}`;
  }
}
