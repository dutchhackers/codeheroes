import { PullRequestReviewCommentEventData } from '@codeheroes/providers';
import { CommonMappedData, PullRequestReviewCommentEvent } from '../../core/interfaces/github.interfaces';
import { GitHubParser } from './base.parser';

export class PullRequestReviewCommentParser extends GitHubParser<
  PullRequestReviewCommentEvent,
  PullRequestReviewCommentEventData
> {
  protected parseSpecific(payload: PullRequestReviewCommentEvent): Omit<PullRequestReviewCommentEventData, keyof CommonMappedData> {
    const { comment, pull_request } = payload;
    
    return {
      action: payload.action,
      prNumber: pull_request.number,
      prTitle: pull_request.title,
      comment: {
        id: comment.id,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        inReplyToId: comment.in_reply_to_id,
      },
      author: this.mapUser(comment.user),
    };
  }
}
