import { PullRequestReviewEventData } from '@codeheroes/providers';
import { PullRequestReviewEvent } from '../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class PullRequestReviewParser extends GitHubParser<PullRequestReviewEvent, PullRequestReviewEventData> {
  parse(payload: PullRequestReviewEvent): PullRequestReviewEventData {
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      action: payload.action,
      state: payload.review.state,
      prNumber: payload.pull_request.number,
      prTitle: payload.pull_request.title,
      reviewer: {
        id: payload.review.user.id.toString(),
        login: payload.review.user.login,
      },
      submittedAt: payload.review.submitted_at,
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }
}
