import { WebhookEvent } from '@codeheroes/common';

export class EventUtils {
    // Note: for now this will only work for GitHub events
    static getEventAction(event: WebhookEvent): string {

    const source = event.publisher.source.toLowerCase();
    const eventType = event.publisher.type;
    const eventAction = (event.data as any)?.action;

    return eventAction ? 
      `${source}.${eventType}.${eventAction}` : 
      `${source}.${eventType}`;
  }
}
