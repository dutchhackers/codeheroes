import { Request } from 'express';
import { GitHubWebhookEvent } from './interfaces';
import {
  CheckRunEvent,
  CheckSuiteEvent,
  IssueEvent,
  PullRequestEvent,
  PushEvent,
  WorkflowJobEvent,
  WorkflowRunEvent,
} from '../../_external/external-github-interfaces';

type GitHubPayload = PushEvent | PullRequestEvent | IssueEvent | WorkflowRunEvent | WorkflowJobEvent | CheckRunEvent | CheckSuiteEvent;

export class GitHubEventUtils {
  static parseWebhookRequest(req: Request): GitHubWebhookEvent {
    const githubEvent = req.header('X-GitHub-Event');
    const eventId = req.header('X-GitHub-Delivery');

    if (!githubEvent || !eventId) {
      throw new Error('Missing required GitHub webhook headers');
    }

    const payload = req.body as GitHubPayload;
    const githubEventAction = (payload as any).action ? 
      `github.${githubEvent}.${(payload as any).action}` : 
      `github.${githubEvent}`;

    return {
      eventId,
      eventType: githubEvent,
      action: githubEventAction,
      payload,
      headers: req.headers,
      source: 'github',
      actor: {
        id: payload.sender.id.toString(),
        username: payload.sender.login,
      },
    };
  }
}
