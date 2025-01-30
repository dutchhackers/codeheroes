import {
  IssueEventData,
  PullRequestEventData,
  PullRequestReviewCommentEventData,
  PullRequestReviewEventData,
  PullRequestReviewThreadEventData,
  PushEventData,
  TimeUtils,
} from '@codeheroes/common';
import { WebhookEvent } from '@codeheroes/event';
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
        if (eventAction === 'opened' || eventAction === 'ready_for_review') {
          return ActivityType.PR_CREATED;
        }
        if (eventAction === 'reviewed') {
          return ActivityType.PR_REVIEW;
        }
        if (eventAction === 'synchronize') {
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
      case 'pull_request_review':
        switch (eventAction) {
          case 'submitted':
            return ActivityType.PR_REVIEW_SUBMITTED;
          case 'edited':
            return ActivityType.PR_REVIEW_UPDATED;
          case 'dismissed':
            return ActivityType.PR_REVIEW_DISMISSED;
        }
        break;
      case 'pull_request_review_thread':
        return eventAction === 'resolved'
          ? ActivityType.PR_REVIEW_THREAD_RESOLVED
          : ActivityType.PR_REVIEW_THREAD_UNRESOLVED;
      case 'pull_request_review_comment':
        switch (eventAction) {
          case 'created':
            return ActivityType.PR_REVIEW_COMMENT_CREATED;
          case 'edited':
            return ActivityType.PR_REVIEW_COMMENT_UPDATED;
        }
        break;
    }
    throw new Error(`Unsupported event type: ${eventType} with action: ${eventAction}`);
  }

  static extractActivityData(event: WebhookEvent): ActivityData | undefined {
    const eventType = event.source.event;
    const eventData = event.data as
      | PushEventData
      | PullRequestEventData
      | IssueEventData
      | PullRequestReviewEventData
      | PullRequestReviewThreadEventData
      | PullRequestReviewCommentEventData;

    switch (eventType) {
      case 'push': {
        const details = eventData as PushEventData;
        return {
          type: 'push',
          branch: details.branch,
          metrics: { ...details.metrics },
        };
      }
      case 'pull_request': {
        const details = eventData as PullRequestEventData;
        return {
          type: 'pull_request',
          prNumber: details.prNumber,
          title: details.title,
          merged: details.merged,
          draft: details.draft,
          action: details.action,
          metrics: {
            ...details.metrics,
            timeInvested: TimeUtils.calculateTimeBetween(details.createdAt, details.updatedAt),
          },
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
      case 'pull_request_review': {
        const details = eventData as PullRequestReviewEventData;
        return {
          type: 'review',
          prNumber: details.prNumber,
          state: details.state,
          submittedAt: details.submittedAt,
        };
      }
      case 'pull_request_review_thread': {
        const details = eventData as PullRequestReviewThreadEventData;
        return {
          type: 'review_thread',
          prNumber: details.prNumber,
          threadId: details.threadId,
          resolved: details.resolved,
        };
      }
      case 'pull_request_review_comment': {
        const details = eventData as PullRequestReviewCommentEventData;
        return {
          type: 'review_comment',
          prNumber: details.prNumber,
          commentId: details.comment.id,
          inReplyToId: details.comment.inReplyToId,
        };
      }
      default:
        return undefined;
    }
  }
}
