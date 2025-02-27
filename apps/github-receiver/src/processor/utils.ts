import { logger } from '@codeheroes/common';
import { Request } from 'express';
import { ErrorType, MESSAGES } from '../core/constants/constants';
import { GitHubEventConfig, SupportedEventType } from '../core/constants/github.constants';
import { GitHubError } from '../core/errors/github-event.error';
import { GitHubWebhookEvent } from './interfaces';

export class GitHubEventUtils {
  static isEventTypeSupported(eventType: string): eventType is SupportedEventType {
    return eventType in GitHubEventConfig;
  }

  static isEventActionSupported(eventType: SupportedEventType, action?: string): boolean {
    const supportedActions = GitHubEventConfig[eventType] as readonly string[];
    if (supportedActions.length === 0) {
      return true; // Events without actions (like push, delete) are always valid
    }
    return action ? supportedActions.includes(action) : false;
  }

  static validateAndParseWebhook(req: Request): GitHubWebhookEvent {
    const githubEvent = req.header('X-GitHub-Event');
    const eventId = req.header('X-GitHub-Delivery');
    const action = req.body?.action;

    logger.info(`Received GitHub event: ${githubEvent} with action: ${action}`);

    if (!githubEvent || !eventId) {
      throw new GitHubError(MESSAGES.MISSING_HEADERS, ErrorType.VALIDATION);
    }

    if (!this.isEventTypeSupported(githubEvent)) {
      throw new GitHubError(MESSAGES.unsupportedEvent(githubEvent), ErrorType.UNSUPPORTED_EVENT);
    }

    if (githubEvent !== 'push' && !this.isEventActionSupported(githubEvent, action)) {
      throw new GitHubError(MESSAGES.unsupportedAction(action, githubEvent), ErrorType.UNSUPPORTED_EVENT);
    }

    const payload = req.body as unknown;

    return {
      eventId,
      eventType: githubEvent,
      payload,
      headers: req.headers,
      provider: 'github',
    };
  }

  static parseEventAction(req: Request): string {
    const githubEvent = req.header('X-GitHub-Event');
    const provider = 'github';
    const action = req.body?.action;

    return action ? `${provider}.${githubEvent}.${action}` : `${provider}.${githubEvent}`;
  }
}
