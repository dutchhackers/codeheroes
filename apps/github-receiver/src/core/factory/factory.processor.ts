import { BaseEventProcessor, PushEventProcessor, PullRequestEventProcessor } from '../processors';
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
      default:
        throw new Error(`Unknown event type: ${type}`);
    }
  }
}
