import { ErrorType, MESSAGES } from '../constants/constants';
import { GitHubError } from '../errors/github-event.error';
import { GitHubWebhookEvent } from '../processors/interfaces';
import { PushEventParser } from './push.parser';
import { PullRequestParser } from './pull-request.parser';
import { IssueParser } from './issue.parser';
import { PullRequestReviewParser } from './pull-request-review.parser';
import { PullRequestReviewThreadParser } from './pull-request-review-thread.parser';
import { PullRequestReviewCommentParser } from './pull-request-review-comment.parser';
import { GitHubParser } from './base.parser';

export class ParserFactory {
  static createParser(webhookEvent: GitHubWebhookEvent): GitHubParser<any, any> {
    switch (webhookEvent.eventType) {
      case 'push':
        return new PushEventParser();
      case 'pull_request':
        return new PullRequestParser();
      case 'issues':
        return new IssueParser();
      case 'pull_request_review':
        return new PullRequestReviewParser();
      case 'pull_request_review_thread':
        return new PullRequestReviewThreadParser();
      case 'pull_request_review_comment':
        return new PullRequestReviewCommentParser();
      default:
        throw new GitHubError(MESSAGES.unsupportedEvent(webhookEvent.eventType), ErrorType.UNSUPPORTED_EVENT);
    }
  }
}
