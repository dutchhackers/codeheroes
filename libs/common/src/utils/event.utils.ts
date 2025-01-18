import { PullRequestEventData, PushEventData, IssueEventData } from "../models";
import { WebhookEvent } from "../models/event.model";
import { ActivityData, ActivityType } from "../models/user.model";

export class EventUtils {
  static mapToActivityType(event: WebhookEvent): ActivityType {
    const eventType = event.source.type;
    const eventAction = (event.data as any)?.action;

    switch (eventType) {
      case 'push':
        return ActivityType.CODE_PUSH;
      case 'pull_request':
        if (eventAction === 'closed' && (event.data as PullRequestEventData).merged) {
          return ActivityType.PR_MERGED;
        }
        if (eventAction === 'opened') {
          return ActivityType.PR_CREATED;
        }
        if (eventAction === 'reviewed') {
          return ActivityType.PR_REVIEW;
        }
        break;
      case 'issue':
        if (eventAction === 'opened') {
          return ActivityType.ISSUE_CREATED;
        }
        if (eventAction === 'closed') {
          return ActivityType.ISSUE_CLOSED;
        }
        break;
    }
    throw new Error(`Unsupported event type: ${eventType} with action: ${eventAction}`);
  }

  static extractActivityData(event: WebhookEvent): ActivityData | undefined {
    const eventType = event.source.type;
    const eventData = event.data as PushEventData | PullRequestEventData | IssueEventData;

    switch (eventType) {
      case 'push': {
        const details = eventData as PushEventData;
        return {
          type: 'push',
          commitCount: details.commitCount,
          branch: details.branch,
        };
      }
      case 'pull_request': {
        const details = eventData as PullRequestEventData;
        return {
          type: 'pull_request',
          prNumber: details.prNumber,
          title: details.title,
          merged: details.merged,
        };
      }
      case 'issue': {
        const details = eventData as IssueEventData;
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
    const eventData = event.data as PushEventData | PullRequestEventData | IssueEventData;
    const repoName = eventData.repository.name;

    switch (eventType) {
      case 'push': {
        const data = eventData as PushEventData;
        const branch = data.branch.replace('refs/heads/', '');
        return `Committed ${data.commitCount} time(s) to ${repoName} (${branch}) (GitHub)`;
      }
      case 'pull_request': {
        const data = eventData as PullRequestEventData;
        const action = data.action === 'closed' && data.state === 'closed' ? 'merged' : data.action;
        return `${action.charAt(0).toUpperCase() + action.slice(1)} PR #${data.prNumber} in ${repoName} (GitHub)`;
      }
      case 'issue': {
        const data = eventData as IssueEventData;
        return `${data.action.charAt(0).toUpperCase() + data.action.slice(1)} issue #${
          data.issueNumber
        } in ${repoName} (GitHub)`;
      }
      default:
        return 'Performed an action on GitHub';
    }
  }
}
