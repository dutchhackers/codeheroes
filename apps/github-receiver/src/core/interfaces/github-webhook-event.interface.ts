import { GitHubEventAction } from './github-event-actions.type';
import { PushEvent, PullRequestEvent, IssueEvent } from './github.interface';

export interface GitHubWebhookEvent {
  eventId: string;
  eventType: string;
  action: GitHubEventAction;
  signature?: string;
  payload: PushEvent | PullRequestEvent | IssueEvent;
  headers: Record<string, string | string[] | undefined>;
  source: string;
}
