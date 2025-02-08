import { Event } from '@codeheroes/event';
import { IEventProvider } from '../interfaces/event-provider.interface';
import { GitHubEventData } from './models/github-event.model';
import { GithubPushEventData } from './models/push-event.model';
import { GithubPullRequestEventData } from './models/pull-request-event.model';
import { GithubIssueEventData } from './models/issue-event.model';
import { GithubPullRequestReviewEventData } from './models/pull-request-review-event.model';
import { GithubPullRequestReviewThreadEventData } from './models/pull-request-review-thread-event.model';
import { GithubPullRequestReviewCommentEventData } from './models/pull-request-review-comment-event.model';
import { GithubCreateEventData } from './models/create-event.model';
import { GithubDeleteEventData } from './models/delete-event.model';
import { GitHubEventFormatter } from './formatters/github-event.formatter';

export class GitHubProvider implements IEventProvider<GitHubEventData> {
  readonly name = 'github';
  private formatter = new GitHubEventFormatter();

  parseEventData(event: Event): GitHubEventData {
    const eventType = event.source.event;
    switch (eventType) {
      case 'push':
        return { push: event.data as GithubPushEventData };
      case 'pull_request':
        return { pullRequest: event.data as GithubPullRequestEventData };
      case 'issues':
        return { issue: event.data as GithubIssueEventData };
      case 'pull_request_review':
        return { pullRequestReview: event.data as GithubPullRequestReviewEventData };
      case 'pull_request_review_thread':
        return { pullRequestReviewThread: event.data as GithubPullRequestReviewThreadEventData };
      case 'pull_request_review_comment':
        return { pullRequestReviewComment: event.data as GithubPullRequestReviewCommentEventData };
      case 'create':
        return { create: event.data as GithubCreateEventData };
      case 'delete':
        return { delete: event.data as GithubDeleteEventData };
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }
  }

  formatDescription(event: Event): string {
    const description = this.formatter.formatDescription(event);
    return `${description} (${this.name})`;
  }
}
