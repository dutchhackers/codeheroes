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

export interface IssueCommentEvent {
  action: 'created' | 'edited' | 'deleted';
  comment: {
    id: number;
    node_id: string;
    user: GitHubUser;
    body: string;
    created_at: string;
    updated_at: string;
    html_url: string;
    issue_url: string;
  };
  issue: {
    id: number;
    node_id: string;
    number: number;
    title: string;
    state: 'open' | 'closed';
    user: GitHubUser;
    created_at: string;
    updated_at: string;
    html_url: string;
    // This field indicates if it's a PR (present) or a regular issue (absent/undefined)
    pull_request?: {
      url: string;
      html_url: string;
      diff_url: string;
      patch_url: string;
    };
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface ReleaseEvent {
  action: 'published' | 'created' | 'released' | 'prereleased' | 'edited' | 'deleted';
  release: {
    id: number;
    node_id: string;
    tag_name: string;
    target_commitish: string;
    name: string | null;
    body: string | null;
    draft: boolean;
    prerelease: boolean;
    created_at: string;
    published_at: string | null;
    html_url: string;
    author: GitHubUser;
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface DiscussionEvent {
  action:
    | 'created'
    | 'edited'
    | 'deleted'
    | 'pinned'
    | 'unpinned'
    | 'closed'
    | 'reopened'
    | 'answered'
    | 'unanswered';
  discussion: {
    id: number;
    node_id: string;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    category: {
      id: number;
      name: string;
      slug: string;
      is_answerable: boolean;
    };
    user: GitHubUser;
    created_at: string;
    updated_at: string;
    html_url: string;
    answer_html_url?: string | null;
    answer_chosen_at?: string | null;
    answer_chosen_by?: GitHubUser | null;
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface DiscussionCommentEvent {
  action: 'created' | 'edited' | 'deleted';
  comment: {
    id: number;
    node_id: string;
    body: string;
    user: GitHubUser;
    created_at: string;
    updated_at: string;
    html_url: string;
    parent_id?: number | null; // If this is a reply to another comment
  };
  discussion: {
    id: number;
    node_id: string;
    number: number;
    title: string;
    state: 'open' | 'closed';
    category: {
      id: number;
      name: string;
      slug: string;
      is_answerable: boolean;
    };
    html_url: string;
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}
