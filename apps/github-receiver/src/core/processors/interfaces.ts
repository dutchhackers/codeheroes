import {
  IssueEvent,
  PullRequestEvent,
  PushEvent,
  WorkflowRunEvent,
  WorkflowJobEvent,
  CheckRunEvent,
  CheckSuiteEvent
} from '../../libs/github-models/external-github-interfaces';

export interface Actor {
  id: string;
  username?: string;
}

export interface GitHubWebhookEvent {
  eventId: string;
  eventType: string;
  action: string;
  signature?: string;
  actor: Actor;
  payload: PushEvent | PullRequestEvent | IssueEvent | WorkflowRunEvent | WorkflowJobEvent | CheckRunEvent | CheckSuiteEvent;
  headers: Record<string, string | string[] | undefined>;
  source: string;
}

export interface ProcessResult {
  success: boolean;
  message: string;
  error?: Error;
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
}

// Base details interface
export interface BaseEventDetails extends Record<string, unknown> {
  repository: Repository;
  lastCommitMessage?: string;
}

// Activity-specific details interfaces
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
  action: string;
}