import { Request } from 'express';
import { GitHubWebhookEvent } from '../interfaces/github-webhook-event.interface';
import {
  CheckRunEvent,
  CheckSuiteEvent,
  IssueEvent,
  PullRequestEvent,
  PushEvent,
  WorkflowJobEvent,
  WorkflowRunEvent,
} from '../interfaces/github.interface';

type GitHubPayload = PushEvent | PullRequestEvent | IssueEvent | WorkflowRunEvent | WorkflowJobEvent | CheckRunEvent | CheckSuiteEvent;

export class GitHubEventUtils {
  static parseWebhookRequest(req: Request): GitHubWebhookEvent {
    const eventType = req.header('X-GitHub-Event');
    const eventId = req.header('X-GitHub-Delivery');
    const signature = req.header('X-Hub-Signature-256');

    if (!eventType || !eventId) {
      throw new Error('Missing required GitHub webhook headers');
    }

    const payload = req.body as GitHubPayload;
    const action = this.#getActionFromPayload(eventType, payload);

    return {
      eventId,
      eventType,
      action: action,
      signature,
      payload,
      headers: req.headers,
      source: 'github',
    };
  }

  static #getActionFromPayload(
    eventType: string,
    payload: GitHubPayload
  ): string {
    const baseAction = `github.${eventType}`;
    const action = (payload as any).action;
    return action ? `${baseAction}.${action}` : baseAction;
  }
}
