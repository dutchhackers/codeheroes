import { GitHubWebhookEvent } from '../interfaces/github-webhook-event.interface';
import { IssueEventProcessor, PullRequestEventProcessor, PushEventProcessor } from '../processors';
import { UnsupportedEventError } from '../errors/github-event.error';
import { BaseEventProcessor } from '../processors/base-event.processor';
import { GitHubEventType } from '../constants/github.constants';

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
