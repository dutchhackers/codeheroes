import { GitHubEventAction } from '../interfaces/github-event-actions.type';
import {
  IssueEvent,
  PullRequestEvent,
  PushEvent,
} from '../interfaces/github.interface';

type GitHubPayload = PushEvent | PullRequestEvent | IssueEvent;

export class GitHubEventUtils {
  static getActionFromPayload(
    eventType: string,
    payload: GitHubPayload
  ): GitHubEventAction {
    switch (eventType) {
      case 'push':
        return 'github.push';

      case 'pull_request':
        {
          const prPayload = payload as PullRequestEvent;
          if (prPayload.pull_request.merged) {
            return 'github.pull_request.merged';
          }
          switch (prPayload.action) {
            case 'opened':
              return 'github.pull_request.opened';
            case 'closed':
              return 'github.pull_request.closed';
          }
        }
        break;

      case 'issues':
        {
          const issuePayload = payload as IssueEvent;
          switch (issuePayload.action) {
            case 'opened':
              return 'github.issue.opened';
            case 'closed':
              return 'github.issue.closed';
          }
        }
        break;
    }

    throw new Error(`Unsupported event type: ${eventType}`);
  }
}
