import { ErrorType, MESSAGES } from '../constants/constants';
import { GitHubError } from '../errors/github-event.error';
import { GitHubWebhookEvent } from '../processors/interfaces';
import {
  GitHubParser,
  IssueParser,
  PullRequestParser,
  PullRequestReviewCommentParser,
  PullRequestReviewParser,
  PullRequestReviewThreadParser,
  PushEventParser,
} from './github.parser';

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
