// Azure DevOps webhook payload structures

export type AzureDevOpsEventType =
  | 'git.push'
  | 'git.pullrequest.created'
  | 'git.pullrequest.updated'
  | 'git.pullrequest.merged';

export type AzureDevOpsWebhook = {
  subscriptionId: string;
  notificationId: number;
  id: string;
  eventType: AzureDevOpsEventType;
  publisherId: string;
  resourceVersion: string;
  createdDate: string;
};

export type AzurePushWebhook = AzureDevOpsWebhook & {
  eventType: 'git.push';
  resource: {
    pushId: number;
    date: string;
    url: string;
    pushedBy: {
      id: string;
      displayName: string;
      uniqueName: string;
    };
    commits: Array<{
      commitId: string;
      comment: string;
      url: string;
      author: {
        name: string;
        email: string;
        date: string;
      };
      committer: {
        name: string;
        email: string;
        date: string;
      };
    }>;
    refUpdates: Array<{
      name: string;
      oldObjectId: string;
      newObjectId: string;
    }>;
    repository: {
      id: string;
      name: string;
      url: string;
      project: {
        id: string;
        name: string;
      };
    };
  };
};

export type AzurePullRequestWebhook = AzureDevOpsWebhook & {
  eventType: 'git.pullrequest.created' | 'git.pullrequest.updated' | 'git.pullrequest.merged';
  resource: {
    pullRequestId: number;
    status: string;
    title: string;
    description: string;
    sourceRefName: string;
    targetRefName: string;
    mergeStatus: string;
    creationDate: string;
    closedDate?: string;
    url: string;
    createdBy: {
      id: string;
      displayName: string;
      uniqueName: string;
    };
    closedBy?: {
      id: string;
      displayName: string;
      uniqueName: string;
    };
    repository: {
      id: string;
      name: string;
      url: string;
      project: {
        id: string;
        name: string;
      };
    };
  };
};
