import { IssueEventData, PullRequestEventData, PushEventData } from "../core";
import { WebhookEvent } from "../event/event.model";
import { ActivityData, ActivityType } from "./activity.model";

export class ActivityUtils {
  static mapToActivityType(event: WebhookEvent): ActivityType {
    const eventType = event.eventType;
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
    const eventType = event.eventType;
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
}
