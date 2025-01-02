import { BaseEventProcessor, PushEventProcessor, PullRequestEventProcessor, IssueEventProcessor } from '../processors';
import { GitHubWebhookEvent } from '../interfaces/github-webhook-event.interface';

export class ProcessorFactory {
  static createProcessor(event: GitHubWebhookEvent): BaseEventProcessor {
    switch (event.eventType) {
      case 'push':
        return new PushEventProcessor(event);
      case 'pull_request':
        return new PullRequestEventProcessor(event);
      case 'issues':
        return new IssueEventProcessor(event);
      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
  }
}
