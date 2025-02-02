import {
  IssueEvent,
  PullRequestEvent,
  PullRequestReviewCommentEvent,
  PullRequestReviewEvent,
  PullRequestReviewThreadEvent,
  PushEvent,
} from '../core/interfaces/github.interfaces';

export interface ProcessResult {
  success: boolean;
  message: string;
  error?: Error;
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
    | PullRequestReviewThreadEvent;
  headers: Record<string, string | string[] | undefined>;
  provider: string;
}
