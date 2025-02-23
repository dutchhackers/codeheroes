import {
  DeleteEvent,
  IssueEvent,
  PullRequestEvent,
  PullRequestReviewCommentEvent,
  PullRequestReviewEvent,
  PullRequestReviewThreadEvent,
  PushEvent,
} from '../core/interfaces/github.interfaces';
import { Event } from '@codeheroes/event';

export interface ProcessResult {
  success: boolean;
  message: string;
  error?: Error;
  event?: Event;
}

export interface GitHubWebhookEvent {
  eventId: string;
  eventType: string;
  signature?: string;
  payload:
    | PushEvent
    | PullRequestEvent
    | PullRequestReviewEvent
    | IssueEvent
    | PullRequestReviewCommentEvent
    | PullRequestReviewThreadEvent
    | DeleteEvent;
  headers: Record<string, string | string[] | undefined>;
  provider: string;
}
