import { Event } from '@codeheroes/event';
import { GithubPullRequestReviewEventData } from '@codeheroes/providers';
import { ActivityType } from '@codeheroes/shared/types';
import { ReviewActivityData } from '@codeheroes/common';
import { BaseActivityHandler } from '../base/base.handler';

export class ReviewSubmitHandler extends BaseActivityHandler {
  protected activityType = ActivityType.PR_REVIEW_SUBMITTED;
  protected eventTypes = ['pull_request_review'];
  protected eventActions = ['submitted'];

  handleActivity(event: Event): ReviewActivityData {
    const details = event.data as GithubPullRequestReviewEventData;
    return {
      type: 'review',
      prNumber: details.prNumber,
      state: details.state,
      submittedAt: details.submittedAt,
    };
  }

  generateDescription(event: Event): string {
    const details = event.data as GithubPullRequestReviewEventData;
    const state = details.state.replace('_', ' ').toLowerCase();
    return `Submitted ${state} review on PR #${details.prNumber}`;
  }
}
