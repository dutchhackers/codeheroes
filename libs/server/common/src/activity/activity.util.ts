import { IssueEventData, PullRequestEventData, PushEventData } from '../core';
import { WebhookEvent } from '../event/event.model';
import { ActivityData, ActivityType } from './activity.model';

export class ActivityUtils {
  static mapToActivityType(event: WebhookEvent): ActivityType {
    const eventType = event.source.event;
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
        if (eventAction === 'syncronized') {
          return ActivityType.PR_UPDATED;
        }
        break;
      case 'issues':
        if (eventAction === 'opened') {
          return ActivityType.ISSUE_CREATED;
        }
        if (eventAction === 'closed') {
          return ActivityType.ISSUE_CLOSED;
        }
        if (eventAction === 'edited') {
          return ActivityType.ISSUE_UPDATED;
        }
        if (eventAction === 'reopened') {
          return ActivityType.ISSUE_REOPENED;
        }
        break;
    }
    throw new Error(`Unsupported event type: ${eventType} with action: ${eventAction}`);
  }

  static extractActivityData(event: WebhookEvent): ActivityData | undefined {
    const eventType = event.source.event;
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
          metrics: { ...details.metrics },
        };
      }
      case 'issues': {
        // Changed from 'issue' to 'issues'
        const details = eventData as IssueEventData;
        return {
          type: 'issue',
          issueNumber: details.issueNumber,
          title: details.title,
          state: details.state,
          stateReason: details.stateReason,
        };
      }
      default:
        return undefined;
    }
  }
}
