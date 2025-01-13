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

  static generateUserFacingDescription(event: WebhookEvent): string {
    const eventType = event.source.type;
    const eventDetails = event.data as PushEventDetails | PullRequestEventDetails | IssueEventDetails;
    const repoName = eventDetails.repository.name;

    switch (eventType) {
      case 'push': {
        const details = eventDetails as PushEventDetails;
        const branch = details.branch.replace('refs/heads/', '');
        return `Committed ${details.commitCount} time(s) to ${repoName} (${branch}) (GitHub)`;
      }
      case 'pull_request': {
        const details = eventDetails as PullRequestEventDetails;
        const action = details.action === 'closed' && details.state === 'closed' ? 'merged' : details.action;
        return `${action.charAt(0).toUpperCase() + action.slice(1)} PR #${details.prNumber} in ${repoName} (GitHub)`;
      }
      case 'issue': {
        const details = eventDetails as IssueEventDetails;
        return `${details.action.charAt(0).toUpperCase() + details.action.slice(1)} issue #${details.issueNumber} in ${repoName} (GitHub)`;
      }
      default:
        return 'Performed an action on GitHub';
    }
  }
}
