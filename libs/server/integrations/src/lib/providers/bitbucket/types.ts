export type BitbucketEventType =
  | 'repo:push'
  | 'pullrequest:created'
  | 'pullrequest:fulfilled';

export type BitbucketActor = {
  account_id: string;
  display_name: string;
  nickname: string;
  uuid: string;
};

export type BitbucketRepository = {
  uuid: string;
  name: string;
  full_name: string;
  workspace: {
    slug: string;
    name: string;
    uuid: string;
  };
};

export type BitbucketWebhook = {
  actor: BitbucketActor;
  repository: BitbucketRepository;
};

export type BitbucketPushWebhook = BitbucketWebhook & {
  push: {
    changes: Array<{
      new: {
        type: string;
        name: string;
        target: {
          hash: string;
          date: string;
          message: string;
          author: {
            raw: string;
            user?: BitbucketActor;
          };
        };
      } | null;
      old: {
        type: string;
        name: string;
        target: {
          hash: string;
        };
      } | null;
      created: boolean;
      closed: boolean;
      forced: boolean;
      commits: Array<{
        hash: string;
        message: string;
        date: string;
        author: {
          raw: string;
          user?: BitbucketActor;
        };
      }>;
    }>;
  };
};

export type BitbucketPullRequestWebhook = BitbucketWebhook & {
  pullrequest: {
    id: number;
    title: string;
    description: string;
    state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
    created_on: string;
    updated_on: string;
    merge_commit?: {
      hash: string;
    } | null;
    close_source_branch: boolean;
    author: BitbucketActor;
    source: {
      branch: {
        name: string;
      };
      repository: BitbucketRepository;
    };
    destination: {
      branch: {
        name: string;
      };
      repository: BitbucketRepository;
    };
    comment_count: number;
    task_count: number;
  };
};
