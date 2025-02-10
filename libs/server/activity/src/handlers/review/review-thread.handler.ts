import { Event } from '@codeheroes/event';
import { GithubPullRequestReviewThreadEventData } from '@codeheroes/providers';
import { ActivityType, ReviewThreadActivityData } from '../../types';
import { BaseActivityHandler } from '../base/base.handler';

export class ReviewThreadHandler extends BaseActivityHandler {
  protected activityType = ActivityType.PR_REVIEW_THREAD_RESOLVED;
  protected eventTypes = ['pull_request_review_thread'];
  protected eventActions = ['resolved', 'unresolved'];

  handleActivity(event: Event): ReviewThreadActivityData {
    const details = event.data as GithubPullRequestReviewThreadEventData;
    return {
      type: 'review_thread',
      prNumber: details.prNumber,
      threadId: details.threadId,
      resolved: details.resolved,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubPullRequestReviewThreadEventData;
    const action = details.resolved ? 'Resolved' : 'Unresolved';
    return `${action} review thread on PR #${details.prNumber}`;
  }
}
