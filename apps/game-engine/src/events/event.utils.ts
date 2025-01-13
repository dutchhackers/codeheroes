import { WebhookEvent, ActivityData } from '@codeheroes/common';

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

    static extractActivityData(event: WebhookEvent): ActivityData | undefined {
      const eventType = event.source.type;
      const data = event.data as any;

      switch (eventType) {
        case 'push':
          return {
            type: 'push',
            commitCount: data.commits?.length ?? 0,
            branch: data.ref
          };
        case 'pull_request':
          return {
            type: 'pull_request',
            prNumber: data.number,
            title: data.pull_request?.title
          };
        case 'issue':
          return {
            type: 'issue',
            issueNumber: data.issue?.number,
            title: data.issue?.title
          };
        default:
          return undefined;
      }
    }
}
