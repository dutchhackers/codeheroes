import { ConnectedAccountProvider } from '@codeheroes/common';

// Base context interface
export interface BaseContext {
  type: string;
  provider: ConnectedAccountProvider;
}

// Code-related contexts
export interface RepositoryContext extends BaseContext {
  type: 'repository';
  repository: {
    id: string;
    name: string;
    owner: string;
    ref?: string; // branch/tag reference
  };
}

export interface PullRequestContext extends BaseContext {
  type: 'pull_request';
  repository: {
    id: string;
    name: string;
    owner: string;
  };
  pullRequest: {
    id: string;
    number: number;
    title: string;
    branch: string;
    baseBranch: string;
  };
}

export interface CodeReviewContext extends BaseContext {
  type: 'code_review';
  repository: {
    id: string;
    name: string;
    owner: string;
  };
  pullRequest: {
    id: string;
    number: number;
    title: string;
  };
  review: {
    id: string;
    state: 'approved' | 'changes_requested' | 'commented';
  };
}

export interface IssueContext extends BaseContext {
  type: 'issue';
  repository: {
    id: string;
    name: string;
    owner: string;
  };
  issue: {
    id: string;
    number: number;
    title: string;
  };
}

export interface CommitDetails {
  id: string;
  message: string;
  timestamp: string;
  author: {
    name: string;
    email: string;
  };
}

export interface CodePushContext extends BaseContext {
  type: 'code_push';
  repository: {
    id: string;
    name: string;
    owner: string;
  };
  branch: string;
  commits: CommitDetails[];
  isNew: boolean;
  isDeleted: boolean;
  isForced: boolean;
}

// Fitness-related contexts
export interface WorkoutContext extends BaseContext {
  type: 'workout';
  activity: {
    type: 'run' | 'ride' | 'swim' | 'walk';
    name: string;
    route?: {
      id: string;
      name: string;
    };
  };
  location?: {
    city?: string;
    country?: string;
  };
}

export type GameActionContext =
  | RepositoryContext
  | PullRequestContext
  | CodeReviewContext
  | IssueContext
  | WorkoutContext
  | CodePushContext;
