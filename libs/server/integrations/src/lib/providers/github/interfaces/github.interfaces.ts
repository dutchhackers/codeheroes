export interface CommonPayload {
  repository?: GitHubRepository;
  sender?: GitHubUser;
}

export interface CommonMappedData {
  repository?: {
    id: string;
    name: string;
    owner: string;
    ownerType: string;
  };
  sender?: {
    id: string;
    login: string;
  };
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
}

export interface GitHubCommit {
  id: string;
  message: string;
  timestamp: string;
  url: string;
  author: {
    name: string;
    email: string;
    username?: string;
  };
  committer?: {
    name: string;
    email: string;
    username?: string;
  };
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  owner: GitHubUser;
}

export interface PushEvent {
  ref: string;
  before?: string;
  after?: string;
  repository: GitHubRepository;
  pusher: {
    name: string;
    email: string;
  };
  sender: GitHubUser;
  created: boolean;
  deleted: boolean;
  forced: boolean;
  base_ref?: string | null;
  compare?: string;
  commits: GitHubCommit[];
  head_commit?: GitHubCommit | null;
}

export interface GitHubHeaders {
  'x-github-event'?: string;
  'x-github-delivery'?: string;
  'x-hub-signature'?: string;
  [key: string]: string | string[] | undefined;
}

export interface GitHubTeam {
  id: number;
  name: string;
  slug: string;
}

export interface PullRequestEvent {
  action:
    | 'opened'
    | 'closed'
    | 'reopened'
    | 'synchronize'
    | 'edited'
    | 'ready_for_review'
    | 'draft'
    | 'converted_to_draft';
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    state: 'open' | 'closed';
    draft: boolean;
    merged: boolean;
    merged_at: string | null;
    merged_by: GitHubUser | null;
    html_url: string;
    body?: string;
    commits: number;
    additions: number;
    deletions: number;
    changed_files: number;
    comments: number;
    created_at: string;
    updated_at: string;
    requested_reviewers?: GitHubUser[];
    requested_teams?: GitHubTeam[];
    head: {
      ref: string;
      sha: string;
      user: GitHubUser;
      repo: GitHubRepository;
    };
    base: {
      ref: string;
      sha: string;
      user: GitHubUser;
      repo: GitHubRepository;
    };
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface IssueEvent {
  action: 'opened' | 'closed' | 'edited' | 'reopened';
  issue: {
    id: number;
    number: number;
    title: string;
    state: 'open' | 'closed';
    state_reason?: 'completed' | 'not_planned' | 'reopened' | null;
    updated_at: string;
    html_url: string;
    body?: string;
    user: GitHubUser;
    created_at: string;
    closed_at?: string;
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface WorkflowRunEvent {
  action: 'requested' | 'completed' | 'in_progress';
  workflow_run: {
    id: number;
    name: string;
    head_branch: string;
    head_sha: string;
    status: string;
    conclusion: string | null;
    workflow_id: number;
    html_url: string;
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface WorkflowJobEvent {
  action: 'queued' | 'in_progress' | 'completed' | 'waiting';
  workflow_job: {
    id: number;
    run_id: number;
    workflow_name: string;
    head_branch: string;
    status: string;
    conclusion: string | null;
    started_at: string;
    completed_at: string | null;
    name: string;
    labels: string[];
    runner_name: string | null;
    html_url: string;
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface CheckRunEvent {
  action: 'created' | 'completed' | 'rerequested' | 'requested_action';
  check_run: {
    id: number;
    head_sha: string;
    status: string;
    conclusion: string | null;
    started_at: string;
    completed_at: string | null;
    output: {
      title: string;
      summary: string;
      text?: string;
    };
    name: string;
    check_suite: {
      id: number;
    };
    html_url: string;
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface CheckSuiteEvent {
  action: 'completed' | 'requested' | 'rerequested';
  check_suite: {
    id: number;
    head_branch: string;
    head_sha: string;
    status: string;
    conclusion: string | null;
    before: string;
    after: string;
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface PullRequestReviewEvent {
  action: 'submitted' | 'edited' | 'dismissed';
  review: {
    id: number;
    node_id: string;
    user: GitHubUser;
    body: string | null;
    state: 'approved' | 'commented' | 'changes_requested';
    submitted_at: string;
    commit_id: string;
    html_url: string;
    pull_request_url?: string;
    _links?: {
      html: { href: string };
      pull_request: { href: string };
    };
  };
  pull_request: {
    id: number;
    number: number;
    title: string;
    state: 'open' | 'closed';
    html_url: string;
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface PullRequestReviewThreadEvent {
  action: 'resolved' | 'unresolved';
  thread: {
    id: number;
    node_id: string;
    comments: number;
    resolved: boolean;
    resolution?: {
      user: GitHubUser;
      commit_id: string;
    };
    line: number;
    start_line?: number;
    original_line?: number;
    side?: string;
    start_side?: string;
    original_position?: number;
    position?: number;
    diff_hunk?: string;
    path?: string;
  };
  pull_request: {
    id: number;
    number: number;
    title: string;
    state: 'open' | 'closed';
    html_url: string;
    user?: GitHubUser;
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface PullRequestReviewCommentEvent {
  action: 'created' | 'edited' | 'deleted';
  comment: {
    id: number;
    user: GitHubUser;
    body: string;
    created_at: string;
    updated_at: string;
    line: number;
    path: string;
    position: number;
    commit_id: string;
    pull_request_review_id: number;
    start_line?: number;
    original_line?: number;
    in_reply_to_id?: number;
    html_url: string;
  };
  pull_request: {
    id: number;
    number: number;
    title: string;
    state: 'open' | 'closed';
    html_url: string;
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface CreateEvent extends CommonPayload {
  ref: string;
  ref_type: 'branch' | 'tag' | 'repository';
  master_branch: string;
  description: string | null;
  pusher_type: string;
}

export interface DeleteEvent {
  ref: string;
  ref_type: 'branch' | 'tag';
  pusher_type: string;
  repository: GitHubRepository;
  sender: GitHubUser;
}
