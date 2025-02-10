import { Event } from '@codeheroes/event';
import { IEventFormatter } from '../../interfaces/event-formatter.interface';
import {
  GithubPushEventData,
  GithubPullRequestEventData,
  GithubIssueEventData,
  GithubPullRequestReviewEventData,
  GithubPullRequestReviewThreadEventData,
  GithubPullRequestReviewCommentEventData,
  GithubCreateEventData,
  GithubDeleteEventData
} from '../models';

export class GitHubEventFormatter implements IEventFormatter {
  getProvider(): string {
    return 'github';
  }

  formatDescription(event: Event): string {
    const eventType = event.source.event;
    const eventData = event.data as
      | GithubPushEventData
      | GithubPullRequestEventData
      | GithubIssueEventData
      | GithubPullRequestReviewEventData
      | GithubPullRequestReviewThreadEventData
      | GithubPullRequestReviewCommentEventData
      | GithubCreateEventData
      | GithubDeleteEventData;
    const repoName = eventData.repository.name;

    switch (eventType) {
      case 'push':
        return this.formatPushEvent(eventData as GithubPushEventData, repoName);
      case 'pull_request':
        return this.formatPullRequestEvent(eventData as GithubPullRequestEventData, repoName);
      case 'issues':
        return this.formatIssueEvent(eventData as GithubIssueEventData, repoName);
      case 'pull_request_review':
        return this.formatPullRequestReviewEvent(eventData as GithubPullRequestReviewEventData, repoName);
      case 'pull_request_review_thread':
        return this.formatPullRequestReviewThreadEvent(eventData as GithubPullRequestReviewThreadEventData, repoName);
      case 'pull_request_review_comment':
        return this.formatPullRequestReviewCommentEvent(eventData as GithubPullRequestReviewCommentEventData, repoName);
      case 'create':
        return this.formatCreateEvent(eventData as GithubCreateEventData, repoName);
      case 'delete':
        return this.formatDeleteEvent(eventData as GithubDeleteEventData, repoName);
      default:
        return 'Performed an action on GitHub';
    }
  }

  private formatPushEvent(data: GithubPushEventData, repoName: string): string {
    const branch = data.branch.replace('refs/heads/', '');
    return `Committed ${data.metrics?.commits} time(s) to ${repoName} (${branch})`;
  }

  private formatPullRequestEvent(data: GithubPullRequestEventData, repoName: string): string {
    const action = data.action === 'closed' && data.state === 'closed' ? 'merged' : data.action;
    return `${action.charAt(0).toUpperCase() + action.slice(1)} PR #${data.prNumber} in ${repoName}`;
  }

  private formatIssueEvent(data: GithubIssueEventData, repoName: string): string {
    return `${data.action.charAt(0).toUpperCase() + data.action.slice(1)} issue #${data.issueNumber} in ${repoName}`;
  }

  private formatPullRequestReviewEvent(data: GithubPullRequestReviewEventData, repoName: string): string {
    return `${data.reviewer.login} ${data.state} PR #${data.prNumber} in ${repoName}`;
  }

  private formatPullRequestReviewThreadEvent(data: GithubPullRequestReviewThreadEventData, repoName: string): string {
    const action = data.resolved ? 'resolved' : 'unresolved';
    return `${data.sender.login} ${action} a review thread on PR #${data.prNumber} in ${repoName}`;
  }

  private formatPullRequestReviewCommentEvent(data: GithubPullRequestReviewCommentEventData, repoName: string): string {
    return `${data.sender.login} ${data.action} a review comment on PR #${data.prNumber} in ${repoName}`;
  }

  private formatCreateEvent(data: GithubCreateEventData, repoName: string): string {
    switch (data.refType) {
      case 'branch':
        return `Created branch ${data.ref} in ${repoName}`;
      case 'tag':
        return `Created tag ${data.ref} in ${repoName}`;
      case 'repository':
        return `Created repository ${repoName}`;
    }
  }

  private formatDeleteEvent(data: GithubDeleteEventData, repoName: string): string {
    return `Deleted ${data.refType} ${data.ref} from ${repoName}`;
  }
}
