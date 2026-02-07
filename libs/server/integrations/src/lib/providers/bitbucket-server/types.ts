export type BitbucketServerEventType =
  | 'repo:refs_changed'
  | 'pr:opened'
  | 'pr:merged';

export type BitbucketServerActor = {
  id: number;
  name: string;
  emailAddress: string;
  displayName: string;
  slug: string;
};

export type BitbucketServerRepository = {
  id: number;
  slug: string;
  name: string;
  project: {
    id: number;
    key: string;
    name: string;
  };
};

export type BitbucketServerPushWebhook = {
  eventKey: 'repo:refs_changed';
  date: string;
  actor: BitbucketServerActor;
  repository: BitbucketServerRepository;
  changes: Array<{
    ref: {
      id: string;
      displayId: string;
      type: string;
    };
    refId: string;
    fromHash: string;
    toHash: string;
    type: 'UPDATE' | 'ADD' | 'DELETE';
  }>;
  commits?: Array<{
    id: string;
    displayId: string;
    message: string;
    authorTimestamp: number;
    author: {
      name: string;
      emailAddress: string;
    };
    committer: {
      name: string;
      emailAddress: string;
    };
  }>;
};

export type BitbucketServerPullRequestWebhook = {
  eventKey: 'pr:opened' | 'pr:merged';
  date: string;
  actor: BitbucketServerActor;
  pullRequest: {
    id: number;
    title: string;
    description: string;
    state: 'OPEN' | 'MERGED' | 'DECLINED';
    createdDate: number;
    updatedDate: number;
    closedDate?: number;
    fromRef: {
      id: string;
      displayId: string;
      repository: BitbucketServerRepository;
    };
    toRef: {
      id: string;
      displayId: string;
      repository: BitbucketServerRepository;
    };
    author: {
      user: BitbucketServerActor;
      role: string;
    };
    reviewers: Array<{
      user: BitbucketServerActor;
      role: string;
      approved: boolean;
    }>;
    properties: {
      commentCount?: number;
    };
  };
};
