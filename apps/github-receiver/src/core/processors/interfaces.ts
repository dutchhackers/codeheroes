import { IssueEvent, PullRequestEvent, PullRequestReviewEvent, PushEvent } from '@shared/github-interfaces';

export interface ProcessResult {
  success: boolean;
  message: string;
  error?: Error;
}

export interface GitHubWebhookEvent {
  eventId: string;
  eventType: string;
  signature?: string;
  payload: PushEvent | PullRequestEvent | PullRequestReviewEvent | IssueEvent;
  headers: Record<string, string | string[] | undefined>;
  provider: string;
}
