import { Event } from '@codeheroes/event';
import { PullRequestReviewThreadEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base.handler';
import { ActivityType, ReviewThreadActivityData, ActivityMetrics } from '../../types';
import { TimeUtils } from '../../utils/time.utils';

export class ReviewThreadHandler extends BaseActivityHandler {
  protected activityType = ActivityType.PR_REVIEW_THREAD_RESOLVED;
  protected eventTypes = ['pull_request_review_thread'];
  protected eventActions = ['resolved', 'unresolved'];

  handle(event: Event): ReviewThreadActivityData {
    const details = event.data as PullRequestReviewThreadEventData;
    return {
      type: 'review_thread',
      prNumber: details.prNumber,
      threadId: details.threadId,
      resolved: details.resolved,
    };
  }

  getMetrics(event: Event): ActivityMetrics {
    return {};
    // const details = event.data as PullRequestReviewThreadEventData;
    // return {
    //   commentsInThread: details.commentCount || 0,
    //   timeToResolve: details.resolved ? TimeUtils.calculateTimeBetween(details.createdAt, details.resolvedAt) : 0,
    // };
  }

  generateDescription(event: Event): string {
    const details = event.data as PullRequestReviewThreadEventData;
    const action = details.resolved ? 'Resolved' : 'Unresolved';
    return `${action} review thread on PR #${details.prNumber}`;
  }
}
