import { ErrorType, MESSAGES } from '../constants/constants';
import { GitHubError } from '../errors/github-event.error';
import { GitHubWebhookEvent } from './interfaces';
import {
  BaseEventProcessor,
  IssueEventProcessor,
  PullRequestEventProcessor,
  PullRequestReviewEventProcessor,
  PushEventProcessor,
  PullRequestReviewThreadProcessor,
  PullRequestReviewCommentProcessor,
} from './processors';

export class ProcessorFactory {
  static createProcessor(webhookEvent: GitHubWebhookEvent): BaseEventProcessor {
    switch (webhookEvent.eventType) {
      case 'push':
        return new PushEventProcessor(webhookEvent);
      case 'pull_request':
        return new PullRequestEventProcessor(webhookEvent);
      case 'issues':
        return new IssueEventProcessor(webhookEvent);
      case 'pull_request_review':
        return new PullRequestReviewEventProcessor(webhookEvent);
      case 'pull_request_review_thread':
        return new PullRequestReviewThreadProcessor(webhookEvent);
      case 'pull_request_review_comment':
        return new PullRequestReviewCommentProcessor(webhookEvent);
      default:
        throw new GitHubError(
          MESSAGES.unsupportedEvent(webhookEvent.eventType),
          ErrorType.UNSUPPORTED_EVENT
        );
    }
  }
}
