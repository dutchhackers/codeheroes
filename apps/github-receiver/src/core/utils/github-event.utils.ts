import { GitHubEventAction } from '../interfaces/github-event-actions.type';
import {
  IssueEvent,
  PullRequestEvent,
  PushEvent,
} from '../interfaces/github.interface';
import { Request } from 'express';
import { GitHubWebhookEvent } from '../interfaces/github-webhook-event.interface';

type GitHubPayload = PushEvent | PullRequestEvent | IssueEvent;

export class GitHubEventUtils {
  static parseWebhookRequest(req: Request): GitHubWebhookEvent {
    const eventType = req.header('X-GitHub-Event');
    const eventId = req.header('X-GitHub-Delivery');
    const signature = req.header('X-Hub-Signature-256');

    if (!eventType || !eventId) {
      throw new Error('Missing required GitHub webhook headers');
    }

    const payload = req.body as GitHubPayload;
    const action = this.getActionFromPayload(eventType, payload);

    return {
      eventId,
      eventType,
      action,
      signature,
      payload,
      headers: req.headers,
      source: 'github',
    };
  }

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
            case 'synchronize':
            case 'edited':
              return 'github.pull_request.updated';
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
