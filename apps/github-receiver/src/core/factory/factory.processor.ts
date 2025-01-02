import { BaseEventProcessor, PushEventProcessor, PullRequestEventProcessor, IssueEventProcessor } from '../processors';
import { EventService } from '@codeheroes/common';

export class ProcessorFactory {
  static createProcessor(
    type: string,
    eventService: EventService
  ): BaseEventProcessor {
    switch (type) {
      case 'push':
        return new PushEventProcessor(eventService);
      case 'pull_request':
        return new PullRequestEventProcessor(eventService);
      case 'issues':
        return new IssueEventProcessor(eventService);
      default:
        throw new Error(`Unknown event type: ${type}`);
    }
  }
}
