import { WebhookEvent } from '@codeheroes/event';
import { IEventProvider } from '../interfaces/event-provider.interface';
import { GitHubEventData } from './models/github-event.model';
import { PushEventData } from './models/push-event.model';
import { PullRequestEventData } from './models/pull-request-event.model';
import { IssueEventData } from './models/issue-event.model';

export class GitHubProvider implements IEventProvider<GitHubEventData> {
  readonly name = 'github';

  parseEventData(event: WebhookEvent): GitHubEventData {
    const eventType = event.source.event;
    switch (eventType) {
      case 'push':
        return { push: event.data as PushEventData };
      case 'pull_request':
        return { pullRequest: event.data as PullRequestEventData };
      case 'issues':
        return { issue: event.data as IssueEventData };
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }
  }

  formatDescription(event: WebhookEvent): string {
    // Move existing formatting logic here

    const eventType = event.source.event;
    const eventData = event.data as PushEventData | PullRequestEventData | IssueEventData;
    // | PullRequestReviewEventData
    // | PullRequestReviewThreadEventData
    // | PullRequestReviewCommentEventData;
    const repoName = eventData.repository.name;

    switch (eventType) {
      case 'push': {
        const data = eventData as PushEventData;
        const branch = data.branch.replace('refs/heads/', '');
        return `Committed ${data.metrics?.commits} time(s) to ${repoName} (${branch}) (GitHub)`;
      }
      case 'pull_request': {
        const data = eventData as PullRequestEventData;
        const action = data.action === 'closed' && data.state === 'closed' ? 'merged' : data.action;
        return `${action.charAt(0).toUpperCase() + action.slice(1)} PR #${data.prNumber} in ${repoName} (GitHub)`;
      }
      case 'issues': {
        const data = eventData as IssueEventData;
        return `${data.action.charAt(0).toUpperCase() + data.action.slice(1)} issue #${
          data.issueNumber
        } in ${repoName} (GitHub)`;
      }
      // case 'pull_request_review': {
      //   const data = eventData as PullRequestReviewEventData;
      //   return `${data.reviewer.login} ${data.state} PR #${data.prNumber} in ${repoName} (GitHub)`;
      // }
      // case 'pull_request_review_thread': {
      //   const data = eventData as PullRequestReviewThreadEventData;
      //   const action = data.resolved ? 'resolved' : 'unresolved';
      //   return `${data.sender.login} ${action} a review thread on PR #${data.prNumber} in ${repoName} (GitHub)`;
      // }
      // case 'pull_request_review_comment': {
      //   const data = eventData as PullRequestReviewCommentEventData;
      //   return `${data.sender.login} ${data.action} a review comment on PR #${data.prNumber} in ${repoName} (GitHub)`;
      // }
      default:
        return 'Performed an action on GitHub';
    }
  }
}
