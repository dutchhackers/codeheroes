import { Event } from '@codeheroes/event';
import { GithubPullRequestReviewEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base.handler';
import {
  ActivityType,
  ReviewActivityData,
  ReviewMetrics
} from '../../types';

export class ReviewSubmitHandler extends BaseActivityHandler {
  protected activityType = ActivityType.PR_REVIEW_SUBMITTED;
  protected eventTypes = ['pull_request_review'];
  protected eventActions = ['submitted'];

  handle(event: Event): ReviewActivityData {
    const details = event.data as GithubPullRequestReviewEventData;
    return {
      type: 'review',
      prNumber: details.prNumber,
      state: details.state,
      submittedAt: details.submittedAt
    };
  }

  getMetrics(event: Event): ReviewMetrics {
    const details = event.data as GithubPullRequestReviewEventData;
    return {
      // commentCount: details.commentCount || 0,
      // threadCount: details.threadCount || 0,
      // timeToComplete: TimeUtils.calculateTimeBetween(details.startedAt, details.submittedAt),
      // linesReviewed: details.linesReviewed || 0
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubPullRequestReviewEventData;
    const state = details.state.replace('_', ' ').toLowerCase();
    return `Submitted ${state} review on PR #${details.prNumber}`;
  }
}
