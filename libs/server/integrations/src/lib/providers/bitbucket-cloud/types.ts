export type BitbucketCloudEventType =
  | 'repo:push'
  | 'pullrequest:created'
  | 'pullrequest:fulfilled';

export type BitbucketCloudActor = {
  account_id: string;
  display_name: string;
  nickname: string;
  uuid: string;
};

export type BitbucketCloudRepository = {
  uuid: string;
  name: string;
  full_name: string;
  workspace: {
    slug: string;
    name: string;
    uuid: string;
  };
};

export type BitbucketCloudWebhook = {
  actor: BitbucketCloudActor;
  repository: BitbucketCloudRepository;
};

export type BitbucketCloudPushWebhook = BitbucketCloudWebhook & {
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
            user?: BitbucketCloudActor;
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
          user?: BitbucketCloudActor;
        };
      }>;
    }>;
  };
};

export type BitbucketCloudPullRequestWebhook = BitbucketCloudWebhook & {
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
    author: BitbucketCloudActor;
    source: {
      branch: {
        name: string;
      };
      repository: BitbucketCloudRepository;
    };
    destination: {
      branch: {
        name: string;
      };
      repository: BitbucketCloudRepository;
    };
    comment_count: number;
    task_count: number;
  };
};
