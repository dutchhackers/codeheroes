import { WebhookEvent } from '@codeheroes/common';

export class EventUtils {
    // Note: for now this will only work for GitHub events
    static getEventAction(event: WebhookEvent): string {

    const source = event.source.provider.toLowerCase();
    const eventType = event.source.type;
    const eventAction = (event.data as any)?.action;

    return eventAction ? 
      `${source}.${eventType}.${eventAction}` : 
      `${source}.${eventType}`;
  }
}
