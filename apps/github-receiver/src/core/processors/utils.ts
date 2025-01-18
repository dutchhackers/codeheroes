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
} from '@shared/github-interfaces';
import { GitHubEventConfig, SupportedEventType } from '../constants/github.constants';
import { GitHubError } from '../errors/github-event.error';
import { ErrorType, MESSAGES } from '../constants/constants';

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
      throw new GitHubError(MESSAGES.MISSING_HEADERS, ErrorType.VALIDATION);
    }

    if (!this.isEventTypeSupported(githubEvent)) {
      throw new GitHubError(MESSAGES.unsupportedEvent(githubEvent), ErrorType.UNSUPPORTED_EVENT);
    }

    if (!this.isEventActionSupported(githubEvent, action)) {
      throw new GitHubError(MESSAGES.unsupportedAction(action, githubEvent), ErrorType.UNSUPPORTED_EVENT);
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
