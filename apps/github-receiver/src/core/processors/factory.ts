import { GitHubEventType } from '../constants/github.constants';
import { UnsupportedEventError } from '../errors/github-event.error';
import { GitHubWebhookEvent } from './interfaces';
import { BaseEventProcessor, PushEventProcessor, PullRequestEventProcessor, IssueEventProcessor } from './processors';

export class ProcessorFactory {
  static createProcessor(event: GitHubWebhookEvent): BaseEventProcessor {
    switch (event.eventType) {
      case GitHubEventType.PUSH:
        return new PushEventProcessor(event);
      case GitHubEventType.PULL_REQUEST:
        return new PullRequestEventProcessor(event);
      case GitHubEventType.ISSUES:
        return new IssueEventProcessor(event);
      default:
        throw new UnsupportedEventError(event.eventType);
    }
  }
}