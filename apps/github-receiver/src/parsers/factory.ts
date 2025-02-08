import { ErrorType, MESSAGES } from '../core/constants/constants';
import { GitHubError } from '../core/errors/github-event.error';
import { GitHubWebhookEvent } from '../processor/interfaces';
import { GitHubParser } from './event-parsers/base.parser';
import { CreateParser } from './event-parsers/create.parser';
import { DeleteEventParser } from './event-parsers/delete.parser';
import { IssueParser } from './event-parsers/issue.parser';
import { PullRequestReviewCommentParser } from './event-parsers/pull-request-review-comment.parser';
import { PullRequestReviewThreadParser } from './event-parsers/pull-request-review-thread.parser';
import { PullRequestReviewParser } from './event-parsers/pull-request-review.parser';
import { PullRequestParser } from './event-parsers/pull-request.parser';
import { PushParser } from './event-parsers/push.parser';

export class ParserFactory {
  static createParser(webhookEvent: GitHubWebhookEvent): GitHubParser<any, any> {
    switch (webhookEvent.eventType) {
      case 'push':
        return new PushParser();
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
      case 'delete':
        return new DeleteEventParser();
      case 'create':
        return new CreateParser();
      default:
        throw new GitHubError(MESSAGES.unsupportedEvent(webhookEvent.eventType), ErrorType.UNSUPPORTED_EVENT);
    }
  }
}
