import { GithubPullRequestReviewEventData } from '@codeheroes/providers';
import { CommonMappedData, PullRequestReviewEvent } from '../../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class PullRequestReviewParser extends GitHubParser<PullRequestReviewEvent, GithubPullRequestReviewEventData> {
  protected parseSpecific(
    payload: PullRequestReviewEvent,
  ): Omit<GithubPullRequestReviewEventData, keyof CommonMappedData> {
    const { review, pull_request } = payload;

    return {
      action: payload.action,
      state: review.state,
      id: pull_request.id,
      prNumber: pull_request.number,
      prTitle: pull_request.title,
      reviewer: this.mapUser(review.user),
      submittedAt: review.submitted_at,
      metrics: {
        commentsCount: review.body ? 1 : 0, // Count the review itself as a comment if it has a body
        threadCount: 0, // This would need to be fetched separately via GitHub API if needed
        changedFiles: 0, // This information is in the PR, not in the review event
        suggestionsCount: 0, // Would need to parse review body for suggestion blocks
      },
    };
  }
}
