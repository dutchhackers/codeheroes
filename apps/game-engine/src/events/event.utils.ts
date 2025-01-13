import { WebhookEvent } from '@codeheroes/common';

export class EventUtils {
  static getEventAction(event: WebhookEvent): string {
    const source = event.publisher.source.toLowerCase();
    const eventType = event.publisher.type;
    // Note: for now this will only work for GitHub events
    const action = (event.data as any)?.action;

    return action ? 
      `${source}.${eventType}.${action}` : 
      `${source}.${eventType}`;
  }
}
