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
import { GitHubEventConfig, SupportedEventType } from '../constants/github.constants';
import { GitHubEventError, UnsupportedEventError } from '../errors/github-event.error';
import { ERROR_MESSAGES } from '../constants/error.constants';

type GitHubPayload =
  | PushEvent
  | PullRequestEvent
  | IssueEvent
  | WorkflowRunEvent
  | WorkflowJobEvent
  | CheckRunEvent
  | CheckSuiteEvent;

export class GitHubEventUtils {
  static isEventTypeSupported(eventType: string): eventType is SupportedEventType {
    return eventType in GitHubEventConfig;
  }

  static isEventActionSupported(eventType: SupportedEventType, action?: string): boolean {
    const supportedActions = GitHubEventConfig[eventType];
    return supportedActions.includes(action as any);
  }

  static validateAndParseWebhook(req: Request): GitHubWebhookEvent {
    const githubEvent = req.header('X-GitHub-Event');
    const eventId = req.header('X-GitHub-Delivery');
    const action = req.body?.action;

    if (!githubEvent || !eventId) {
      throw new GitHubEventError(ERROR_MESSAGES.MISSING_HEADERS);
    }

    if (!this.isEventTypeSupported(githubEvent)) {
      throw new UnsupportedEventError(githubEvent);
    }

    if (!this.isEventActionSupported(githubEvent, action)) {
      throw new UnsupportedEventError(ERROR_MESSAGES.UNSUPPORTED_ACTION(action, githubEvent));
    }

    const payload = req.body as GitHubPayload;

    return {
      eventId,
      eventType: githubEvent,
      payload,
      headers: req.headers,
      source: 'github',
    };
  }

  static parseEventAction(req: Request): string {
    const githubEvent = req.header('X-GitHub-Event');
    const source = 'github';
    const action = req.body?.action;

    return action ? `${source}.${githubEvent}.${action}` : `${source}.${githubEvent}`;
  }
}
