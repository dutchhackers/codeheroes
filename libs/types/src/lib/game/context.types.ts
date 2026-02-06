import { ConnectedAccountProvider } from '../core/providers';

export interface Repository {
  id: string;
  name: string;
  owner: string;
  ref?: string; // branch/tag reference
}

export interface CommitDetails {
  id: string;
  message: string;
  timestamp: string;
  author: {
    name: string;
    email: string;
  };
  committer?: {
    name: string;
    email: string;
  };
}

export interface BaseContext {
  type: string;
  provider: ConnectedAccountProvider;
}

export interface ManualContext extends BaseContext {
  type: 'manual';
  provider: 'system' | ConnectedAccountProvider; // system is used for manual updates; for now added to ConnectedAccountProvider
}

// Code-related contexts
export interface RepositoryContext extends BaseContext {
  type: 'repository';
  repository: Repository;
}

export interface PullRequestContext extends BaseContext {
  type: 'pull_request';
  repository: Repository;
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
  repository: Repository;
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
  repository: Repository;
  issue: {
    id: string;
    number: number;
    title: string;
  };
  linkedPRs?: string[]; // Optional array of linked Pull Request IDs
}

export interface CodePushContext extends BaseContext {
  type: 'code_push';
  repository: Repository;
  branch: string;
  commits: CommitDetails[];
  isNew: boolean;
  isDeleted: boolean;
  isForced: boolean;
}

export interface CommentContext extends BaseContext {
  type: 'comment';
  repository: Repository;
  comment: {
    id: string;
    body: string;
  };
  // Target can be an issue or a pull request
  target: {
    type: 'issue' | 'pull_request';
    id: string;
    number: number;
    title: string;
  };
}

export interface ReviewCommentContext extends BaseContext {
  type: 'review_comment';
  repository: Repository;
  pullRequest: {
    id: string;
    number: number;
    title: string;
  };
  comment: {
    id: string;
    body: string;
    path: string; // File path being commented on
    line: number; // Line number in the file
  };
}

export interface ReleaseContext extends BaseContext {
  type: 'release';
  repository: Repository;
  release: {
    id: string;
    tagName: string;
    name: string | null;
    body: string | null;
    isDraft: boolean;
    isPrerelease: boolean;
  };
}

export interface WorkflowRunContext extends BaseContext {
  type: 'workflow_run';
  repository: Repository;
  workflow: {
    id: string;
    name: string;
    headBranch: string;
    conclusion: string;
  };
}

export interface DiscussionContext extends BaseContext {
  type: 'discussion';
  repository: Repository;
  discussion: {
    id: string;
    number: number;
    title: string;
    categoryName: string;
    isAnswerable: boolean;
  };
  // For discussion_comment action
  comment?: {
    id: string;
    body: string;
  };
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
  | CommentContext
  | ReviewCommentContext
  | ReleaseContext
  | WorkflowRunContext
  | DiscussionContext
  | WorkoutContext
  | CodePushContext
  | ManualContext;
