import { BaseEventProcessor } from './processors/base/base-event.processor';
import { PushEventProcessor } from './github/push-event.processor';
import { EventService } from '@codeheroes/common';

export class ProcessorFactory {
  static createProcessor(
    type: string,
    eventService: EventService
  ): BaseEventProcessor {
    switch (type) {
      case 'push':
        return new PushEventProcessor(eventService);
      default:
        throw new Error(`Unknown event type: ${type}`);
    }
  }
}