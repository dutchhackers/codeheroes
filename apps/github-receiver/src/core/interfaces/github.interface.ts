export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubCommit {
  id: string;
  message: string;
  timestamp: string;
  url: string;
  author: {
    name: string;
    email: string;
    username: string;
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
  before: string;
  after: string;
  repository: GitHubRepository;
  pusher: {
    name: string;
    email: string;
  };
  sender: GitHubUser;
  created: boolean;
  deleted: boolean;
  forced: boolean;
  base_ref: string | null;
  compare: string;
  commits: GitHubCommit[];
  head_commit: GitHubCommit | null;
}

export interface GitHubHeaders {
  'x-github-event'?: string;
  'x-github-delivery'?: string;
  'x-hub-signature'?: string;
  [key: string]: string | string[] | undefined;
}

export interface PullRequestEvent {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize' | 'edited' | 'ready_for_review' | 'draft';
  number: number;
  pull_request: {
    id: number;
    title: string;
    state: 'open' | 'closed';
    draft: boolean;
    merged: boolean;
    updated_at: string;
    html_url: string;
    body?: string;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
  };
  sender: {
    id: number;
    login: string;
  };
}