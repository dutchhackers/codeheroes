import { WebhookEvent } from '@codeheroes/event';
import { IEventFormatter } from '../../interfaces/event-formatter.interface';
import {
  PushEventData,
  PullRequestEventData,
  IssueEventData,
  PullRequestReviewEventData,
  PullRequestReviewThreadEventData,
  PullRequestReviewCommentEventData
} from '../models';

export class GitHubEventFormatter implements IEventFormatter {
  getProvider(): string {
    return 'github';
  }

  formatDescription(event: WebhookEvent): string {
    const eventType = event.source.event;
    const eventData = event.data as
      | PushEventData
      | PullRequestEventData
      | IssueEventData
      | PullRequestReviewEventData
      | PullRequestReviewThreadEventData
      | PullRequestReviewCommentEventData;
    const repoName = eventData.repository.name;

    switch (eventType) {
      case 'push':
        return this.formatPushEvent(eventData as PushEventData, repoName);
      case 'pull_request':
        return this.formatPullRequestEvent(eventData as PullRequestEventData, repoName);
      case 'issues':
        return this.formatIssueEvent(eventData as IssueEventData, repoName);
      case 'pull_request_review':
        return this.formatPullRequestReviewEvent(eventData as PullRequestReviewEventData, repoName);
      case 'pull_request_review_thread':
        return this.formatPullRequestReviewThreadEvent(eventData as PullRequestReviewThreadEventData, repoName);
      case 'pull_request_review_comment':
        return this.formatPullRequestReviewCommentEvent(eventData as PullRequestReviewCommentEventData, repoName);
      default:
        return 'Performed an action on GitHub';
    }
  }

  private formatPushEvent(data: PushEventData, repoName: string): string {
    const branch = data.branch.replace('refs/heads/', '');
    return `Committed ${data.metrics?.commits} time(s) to ${repoName} (${branch})`;
  }

  private formatPullRequestEvent(data: PullRequestEventData, repoName: string): string {
    const action = data.action === 'closed' && data.state === 'closed' ? 'merged' : data.action;
    return `${action.charAt(0).toUpperCase() + action.slice(1)} PR #${data.prNumber} in ${repoName}`;
  }

  private formatIssueEvent(data: IssueEventData, repoName: string): string {
    return `${data.action.charAt(0).toUpperCase() + data.action.slice(1)} issue #${data.issueNumber} in ${repoName}`;
  }

  private formatPullRequestReviewEvent(data: PullRequestReviewEventData, repoName: string): string {
    return `${data.reviewer.login} ${data.state} PR #${data.prNumber} in ${repoName}`;
  }

  private formatPullRequestReviewThreadEvent(data: PullRequestReviewThreadEventData, repoName: string): string {
    const action = data.resolved ? 'resolved' : 'unresolved';
    return `${data.sender.login} ${action} a review thread on PR #${data.prNumber} in ${repoName}`;
  }

  private formatPullRequestReviewCommentEvent(data: PullRequestReviewCommentEventData, repoName: string): string {
    return `${data.sender.login} ${data.action} a review comment on PR #${data.prNumber} in ${repoName}`;
  }
}