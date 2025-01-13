import {
  WebhookEvent,
  ActivityData,
  PushEventDetails,
  PullRequestEventDetails,
  IssueEventDetails,
} from '@codeheroes/common';

export class EventUtils {
  // Note: for now this will only work for GitHub events
  static getEventAction(event: WebhookEvent): string {
    const source = event.source.provider.toLowerCase();
    const eventType = event.source.type;
    const eventAction = (event.data as any)?.action;

    return eventAction ? `${source}.${eventType}.${eventAction}` : `${source}.${eventType}`;
  }

  static extractActivityData(event: WebhookEvent): ActivityData | undefined {
    const eventType = event.source.type;
    const eventDetails = event.data as PushEventDetails | PullRequestEventDetails | IssueEventDetails;

    switch (eventType) {
      case 'push': {
        const details = eventDetails as PushEventDetails;
        return {
          type: 'push',
          commitCount: details.commitCount,
          branch: details.branch,
        };
      }
      case 'pull_request': {
        const details = eventDetails as PullRequestEventDetails;
        return {
          type: 'pull_request',
          prNumber: details.prNumber,
          title: details.title,
        };
      }
      case 'issue': {
        const details = eventDetails as IssueEventDetails;
        return {
          type: 'issue',
          issueNumber: details.issueNumber,
          title: details.title,
        };
      }
      default:
        return undefined;
    }
  }
}
