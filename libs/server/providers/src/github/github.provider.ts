import { Event } from '@codeheroes/event';
import { IEventProvider } from '../interfaces/event-provider.interface';
import { GitHubEventData } from './models/github-event.model';
import { PushEventData } from './models/push-event.model';
import { PullRequestEventData } from './models/pull-request-event.model';
import { IssueEventData } from './models/issue-event.model';
import { PullRequestReviewEventData } from './models/pull-request-review-event.model';
import { PullRequestReviewThreadEventData } from './models/pull-request-review-thread-event.model';
import { PullRequestReviewCommentEventData } from './models/pull-request-review-comment-event.model';
import { CreateEventData } from './models/create-event.model';
import { DeleteEventData } from './models/delete-event.model';
import { GitHubEventFormatter } from './formatters/github-event.formatter';

export class GitHubProvider implements IEventProvider<GitHubEventData> {
  readonly name = 'github';
  private formatter = new GitHubEventFormatter();

  parseEventData(event: Event): GitHubEventData {
    const eventType = event.source.event;
    switch (eventType) {
      case 'push':
        return { push: event.data as PushEventData };
      case 'pull_request':
        return { pullRequest: event.data as PullRequestEventData };
      case 'issues':
        return { issue: event.data as IssueEventData };
      case 'pull_request_review':
        return { pullRequestReview: event.data as PullRequestReviewEventData };
      case 'pull_request_review_thread':
        return { pullRequestReviewThread: event.data as PullRequestReviewThreadEventData };
      case 'pull_request_review_comment':
        return { pullRequestReviewComment: event.data as PullRequestReviewCommentEventData };
      case 'create':
        return { create: event.data as CreateEventData };
      case 'delete':
        return { delete: event.data as DeleteEventData };
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }
  }

  formatDescription(event: Event): string {
    const description = this.formatter.formatDescription(event);
    return `${description} (${this.name})`;
  }
}
