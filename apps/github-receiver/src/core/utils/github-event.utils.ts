import { Request } from 'express';
import { UnsupportedEventError } from '../errors/github-event.error';
import { GitHubWebhookEvent } from '../interfaces/github-webhook-event.interface';
import {
  IssueEvent,
  PullRequestEvent,
  PushEvent,
  WorkflowRunEvent,
  WorkflowJobEvent,
  CheckRunEvent,
  CheckSuiteEvent,
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
    console.log('action', action);

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

    switch (eventType) {
      case 'push':
        return baseAction;

      case 'pull_request': {
        const prPayload = payload as PullRequestEvent;
        if (prPayload.pull_request.merged) {
          return `${baseAction}.merged`;
        }
        return prPayload.action ? `${baseAction}.${prPayload.action}` : baseAction;
      }

      case 'issues': {
        const issuePayload = payload as IssueEvent;
        return issuePayload.action ? `${baseAction}.${issuePayload.action}` : baseAction;
      }

      case 'workflow_run': {
        const workflowPayload = payload as WorkflowRunEvent;
        return workflowPayload.action ? `${baseAction}.${workflowPayload.action}` : baseAction;
      }

      case 'workflow_job': {
        const workflowJobPayload = payload as WorkflowJobEvent;
        return workflowJobPayload.action ? `${baseAction}.${workflowJobPayload.action}` : baseAction;
      }

      case 'check_run': {
        const checkRunPayload = payload as CheckRunEvent;
        return checkRunPayload.action ? `${baseAction}.${checkRunPayload.action}` : baseAction;
      }

      case 'check_suite': {
        const checkSuitePayload = payload as CheckSuiteEvent;
        return checkSuitePayload.action ? `${baseAction}.${checkSuitePayload.action}` : baseAction;
      }
    }

    throw new UnsupportedEventError(eventType);
  }
}
