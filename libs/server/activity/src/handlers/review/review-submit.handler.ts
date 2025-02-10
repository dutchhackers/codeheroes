import { Event } from '@codeheroes/event';
import { GithubPullRequestReviewEventData } from '@codeheroes/providers';
import { BaseActivityHandler } from '../base/base.handler';
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

  generateDescription(event: Event): string {
    const details = event.data as GithubPullRequestReviewEventData;
    const state = details.state.replace('_', ' ').toLowerCase();
    return `Submitted ${state} review on PR #${details.prNumber}`;
  }
}
