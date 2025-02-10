import { GithubPullRequestReviewEventData } from '@codeheroes/providers';
import { CommonMappedData, PullRequestReviewEvent } from '../../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class PullRequestReviewParser extends GitHubParser<PullRequestReviewEvent, GithubPullRequestReviewEventData> {
  protected parseSpecific(payload: PullRequestReviewEvent): Omit<GithubPullRequestReviewEventData, keyof CommonMappedData> {
    const { review, pull_request } = payload;

    return {
      action: payload.action,
      state: review.state,
      prNumber: pull_request.number,
      prTitle: pull_request.title,
      reviewer: this.mapUser(review.user),
      submittedAt: review.submitted_at,
    };
  }
}
