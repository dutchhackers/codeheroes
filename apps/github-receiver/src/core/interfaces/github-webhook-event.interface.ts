import {
  IssueEvent,
  PullRequestEvent,
  PushEvent,
  WorkflowRunEvent,
  WorkflowJobEvent,
  CheckRunEvent,
  CheckSuiteEvent
} from './github.interface';

export interface GitHubWebhookEvent {
  eventId: string;
  eventType: string;
  action: string;
  signature?: string;
  payload: PushEvent | PullRequestEvent | IssueEvent | WorkflowRunEvent | WorkflowJobEvent | CheckRunEvent | CheckSuiteEvent;
  headers: Record<string, string | string[] | undefined>;
  source: string;
}
