import { PullRequestReviewCommentEventData } from '@codeheroes/providers';
import { PullRequestReviewCommentEvent } from '../../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class PullRequestReviewCommentParser extends GitHubParser<
  PullRequestReviewCommentEvent,
  PullRequestReviewCommentEventData
> {
  parse(payload: PullRequestReviewCommentEvent): PullRequestReviewCommentEventData {
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      action: payload.action,
      prNumber: payload.pull_request.number,
      prTitle: payload.pull_request.title,
      comment: {
        id: payload.comment.id,
        createdAt: payload.comment.created_at,
        updatedAt: payload.comment.updated_at,
        inReplyToId: payload.comment.in_reply_to_id,
      },
      author: {
        id: payload.comment.user.id.toString(),
        login: payload.comment.user.login,
      },
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }
}
