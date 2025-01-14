import {
  CheckRunEvent,
  CheckSuiteEvent,
  IssueEvent,
  PullRequestEvent,
  PushEvent,
  WorkflowJobEvent,
  WorkflowRunEvent,
} from '../../_external/external-github-interfaces';

// Webhook event interface
export interface GitHubWebhookEvent {
  eventId: string;
  eventType: string;
  signature?: string;
  payload:
    | PushEvent
    | PullRequestEvent
    | IssueEvent
    | WorkflowRunEvent
    | WorkflowJobEvent
    | CheckRunEvent
    | CheckSuiteEvent;
  headers: Record<string, string | string[] | undefined>;
  source: string;
}
