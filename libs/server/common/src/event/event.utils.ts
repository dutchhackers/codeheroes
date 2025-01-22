import { IssueEventData, PullRequestEventData, PushEventData } from '../core/models/github-shared.model';
import { WebhookEvent } from './event.model';

export class EventUtils {
  static generateUserFacingDescription(event: WebhookEvent): string {
    const eventType = event.source.event;
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
