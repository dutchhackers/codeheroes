import { GitHubWebhookEvent } from './interfaces';
import { BaseEventProcessor, PushEventProcessor, PullRequestEventProcessor, IssueEventProcessor } from './processors';

export class ProcessorFactory {
  static createProcessor(event: GitHubWebhookEvent): BaseEventProcessor {
    switch (event.eventType) {
      case 'push':
        return new PushEventProcessor(event);
      case 'pull_request':
        return new PullRequestEventProcessor(event);
      case 'issue':
        return new IssueEventProcessor(event);
      default:
        // This should never happen as GitHubEventUtils validates event types
        throw new Error(`Unexpected event type: ${event.eventType}`);
    }
  }
}
