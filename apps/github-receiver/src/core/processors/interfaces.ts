import {
  CheckRunEvent,
  CheckSuiteEvent,
  IssueEvent,
  PullRequestEvent,
  PushEvent,
  WorkflowJobEvent,
  WorkflowRunEvent
} from '../../_external/external-github-interfaces';

// Core interfaces

export interface Repository {
  id: string;
  name: string;
  owner: string;
}

export interface ProcessResult {
  success: boolean;
  message: string;
  error?: Error;
}

// Webhook event interface
export interface GitHubWebhookEvent {
  eventId: string;
  eventType: string;
  action: string;
  signature?: string;
  payload: PushEvent | PullRequestEvent | IssueEvent | WorkflowRunEvent | WorkflowJobEvent | CheckRunEvent | CheckSuiteEvent;
  headers: Record<string, string | string[] | undefined>;
  source: string;
}

// Event details interfaces
export interface Sender {
  id: string;
  login: string;
}

export interface BaseEventDetails extends Record<string, unknown> {
  repository: Repository;
  lastCommitMessage?: string;
  action: string;
  sender: Sender;
}

export interface PushEventDetails extends BaseEventDetails {
  commitCount: number;
  branch: string;
}

export interface PullRequestEventDetails extends BaseEventDetails {
  prNumber: number;
  title: string;
  state: string;
}

export interface IssueEventDetails extends BaseEventDetails {
  issueNumber: number;
  title: string;
  state: string;
}