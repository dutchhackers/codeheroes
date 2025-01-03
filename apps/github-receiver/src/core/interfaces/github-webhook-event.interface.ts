import { IssueEvent, PullRequestEvent, PushEvent } from './github.interface';

export interface GitHubWebhookEvent {
  eventId: string;
  eventType: string;
  action: string;
  signature?: string;
  payload: PushEvent | PullRequestEvent | IssueEvent;
  headers: Record<string, string | string[] | undefined>;
  source: string;
}
