import { AzureDevOpsProviderAdapter } from '../adapter';
import { AzurePushWebhook, AzurePullRequestWebhook } from '../types';

describe('AzureDevOpsProviderAdapter', () => {
  let adapter: AzureDevOpsProviderAdapter;

  beforeEach(() => {
    adapter = new AzureDevOpsProviderAdapter();
  });

  describe('validateWebhook', () => {
    it('should validate a valid Azure DevOps webhook', () => {
      const result = adapter.validateWebhook({}, {
        eventType: 'git.push',
        id: 'abc-123',
        notificationId: 1,
      });
      expect(result.isValid).toBe(true);
      expect(result.eventType).toBe('git.push');
      expect(result.eventId).toBe('abc-123');
    });

    it('should use notificationId when id is missing', () => {
      const result = adapter.validateWebhook({}, {
        eventType: 'git.push',
        notificationId: 42,
      });
      expect(result.isValid).toBe(true);
      expect(result.eventId).toBe('42');
    });

    it('should reject when eventType is missing', () => {
      const result = adapter.validateWebhook({}, { id: 'abc-123' });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('missing eventType');
    });

    it('should reject when both id and notificationId are missing', () => {
      const result = adapter.validateWebhook({}, { eventType: 'git.push' });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('missing id/notificationId');
    });

    it('should reject when body is empty', () => {
      const result = adapter.validateWebhook({}, null);
      expect(result.isValid).toBe(false);
    });

    it('should validate correct Basic Auth when secret is set', () => {
      const secret = 'user:pass';
      const headers = {
        authorization: 'Basic ' + Buffer.from(secret).toString('base64'),
      };
      const result = adapter.validateWebhook(headers, {
        eventType: 'git.push',
        id: 'abc-123',
      }, secret);
      expect(result.isValid).toBe(true);
    });

    it('should reject when secret is set but Authorization header is missing', () => {
      const result = adapter.validateWebhook({}, {
        eventType: 'git.push',
        id: 'abc-123',
      }, 'user:pass');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing Authorization header');
    });

    it('should reject when Authorization header has wrong value', () => {
      const headers = {
        authorization: 'Basic ' + Buffer.from('wrong:creds').toString('base64'),
      };
      const result = adapter.validateWebhook(headers, {
        eventType: 'git.push',
        id: 'abc-123',
      }, 'user:pass');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid Authorization header');
    });
  });

  describe('extractUserId', () => {
    it('should extract pushedBy.id for push events', () => {
      const result = adapter.extractUserId({
        resource: {
          pushedBy: { id: 'user-guid-123', displayName: 'Test User', uniqueName: 'test@example.com' },
        },
      });
      expect(result).toBe('user-guid-123');
    });

    it('should extract createdBy.id for PR events', () => {
      const result = adapter.extractUserId({
        resource: {
          createdBy: { id: 'user-guid-456', displayName: 'Test User', uniqueName: 'test@example.com' },
        },
      });
      expect(result).toBe('user-guid-456');
    });

    it('should prefer pushedBy over createdBy', () => {
      const result = adapter.extractUserId({
        resource: {
          pushedBy: { id: 'pusher-id', displayName: 'Pusher', uniqueName: 'pusher@example.com' },
          createdBy: { id: 'creator-id', displayName: 'Creator', uniqueName: 'creator@example.com' },
        },
      });
      expect(result).toBe('pusher-id');
    });

    it('should extract closedBy.id for merged/abandoned PRs', () => {
      const result = adapter.extractUserId({
        resource: {
          closedBy: { id: 'closer-id', displayName: 'Closer', uniqueName: 'closer@example.com' },
          createdBy: { id: 'creator-id', displayName: 'Creator', uniqueName: 'creator@example.com' },
        },
      });
      expect(result).toBe('closer-id');
    });

    it('should prefer pushedBy over closedBy and createdBy', () => {
      const result = adapter.extractUserId({
        resource: {
          pushedBy: { id: 'pusher-id', displayName: 'Pusher', uniqueName: 'pusher@example.com' },
          closedBy: { id: 'closer-id', displayName: 'Closer', uniqueName: 'closer@example.com' },
          createdBy: { id: 'creator-id', displayName: 'Creator', uniqueName: 'creator@example.com' },
        },
      });
      expect(result).toBe('pusher-id');
    });

    it('should prefer closedBy over createdBy', () => {
      const result = adapter.extractUserId({
        resource: {
          closedBy: { id: 'closer-id', displayName: 'Closer', uniqueName: 'closer@example.com' },
          createdBy: { id: 'creator-id', displayName: 'Creator', uniqueName: 'creator@example.com' },
        },
      });
      expect(result).toBe('closer-id');
    });

    it('should return undefined when no user info present', () => {
      const result = adapter.extractUserId({ resource: {} });
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty payload', () => {
      const result = adapter.extractUserId(null);
      expect(result).toBeUndefined();
    });
  });

  describe('mapEventToGameAction - push events', () => {
    const basePushWebhook: AzurePushWebhook = {
      subscriptionId: 'sub-1',
      notificationId: 1,
      id: 'event-1',
      eventType: 'git.push',
      publisherId: 'tfs',
      resourceVersion: '1.0',
      createdDate: '2024-01-01T00:00:00Z',
      resource: {
        pushId: 100,
        date: '2024-01-01T00:00:00Z',
        url: 'https://dev.azure.com/org/project/_apis/git/repositories/repo/pushes/100',
        pushedBy: {
          id: 'user-guid-123',
          displayName: 'Test User',
          uniqueName: 'test@example.com',
        },
        commits: [
          {
            commitId: 'abc123def456',
            comment: 'Initial commit',
            url: 'https://dev.azure.com/org/project/_apis/git/repositories/repo/commits/abc123',
            author: { name: 'Test User', email: 'test@example.com', date: '2024-01-01T00:00:00Z' },
            committer: { name: 'Test User', email: 'test@example.com', date: '2024-01-01T00:00:00Z' },
          },
        ],
        refUpdates: [
          { name: 'refs/heads/main', oldObjectId: '000000', newObjectId: 'abc123' },
        ],
        repository: {
          id: 'repo-guid',
          name: 'my-repo',
          url: 'https://dev.azure.com/org/project/_apis/git/repositories/repo',
          project: { id: 'project-guid', name: 'MyProject' },
        },
      },
    };

    it('should map push event to code_push action', () => {
      const result = adapter.mapEventToGameAction('git.push', basePushWebhook, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('code_push');
      expect((result as any)?.userId).toBe('user-123');
      expect((result as any)?.provider).toBe('azure');
      expect((result as any)?.context?.branch).toBe('main');
      expect((result as any)?.context?.commits).toHaveLength(1);
      expect((result as any)?.context?.repository?.name).toBe('my-repo');
      expect((result as any)?.context?.repository?.owner).toBe('MyProject');
    });

    it('should strip refs/heads/ prefix from branch name', () => {
      const result = adapter.mapEventToGameAction('git.push', basePushWebhook, 'user-123');
      expect((result as any)?.context?.branch).toBe('main');
    });

    it('should skip push with empty commits', () => {
      const emptyPush = {
        ...basePushWebhook,
        resource: { ...basePushWebhook.resource, commits: [] },
      };
      const result = adapter.mapEventToGameAction('git.push', emptyPush, 'user-123');
      expect((result as any)?.skipReason).toBe('Push contains no commits');
    });

    it('should map commit details including committer', () => {
      const result = adapter.mapEventToGameAction('git.push', basePushWebhook, 'user-123');
      const commits = (result as any)?.context?.commits;
      expect(commits[0].committer).toEqual({ name: 'Test User', email: 'test@example.com' });
    });
  });

  describe('mapEventToGameAction - pull request events', () => {
    const basePrWebhook: AzurePullRequestWebhook = {
      subscriptionId: 'sub-1',
      notificationId: 2,
      id: 'event-2',
      eventType: 'git.pullrequest.created',
      publisherId: 'tfs',
      resourceVersion: '1.0',
      createdDate: '2024-01-01T00:00:00Z',
      resource: {
        pullRequestId: 42,
        status: 'active',
        title: 'Add feature X',
        description: 'This adds feature X',
        sourceRefName: 'refs/heads/feature/add-x',
        targetRefName: 'refs/heads/main',
        mergeStatus: 'succeeded',
        creationDate: '2024-01-01T00:00:00Z',
        url: 'https://dev.azure.com/org/project/_apis/git/pullRequests/42',
        createdBy: {
          id: 'user-guid-456',
          displayName: 'Test User',
          uniqueName: 'test@example.com',
        },
        repository: {
          id: 'repo-guid',
          name: 'my-repo',
          url: 'https://dev.azure.com/org/project/_apis/git/repositories/repo',
          project: { id: 'project-guid', name: 'MyProject' },
        },
      },
    };

    it('should map PR created event to pull_request_create', () => {
      const result = adapter.mapEventToGameAction('git.pullrequest.created', basePrWebhook, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('pull_request_create');
      expect((result as any)?.userId).toBe('user-123');
      expect((result as any)?.context?.pullRequest?.title).toBe('Add feature X');
      expect((result as any)?.context?.pullRequest?.branch).toBe('feature/add-x');
      expect((result as any)?.context?.pullRequest?.baseBranch).toBe('main');
    });

    it('should map PR merged event to pull_request_merge', () => {
      const mergedPr: AzurePullRequestWebhook = {
        ...basePrWebhook,
        eventType: 'git.pullrequest.merged',
        resource: {
          ...basePrWebhook.resource,
          status: 'completed',
          closedDate: '2024-01-02T00:00:00Z',
        },
      };
      const result = adapter.mapEventToGameAction('git.pullrequest.merged', mergedPr, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('pull_request_merge');
    });

    it('should return null for unregistered event types', () => {
      const result = adapter.mapEventToGameAction('unknown.event', basePrWebhook, 'user-123');
      expect(result).toBeNull();
    });

    it('should strip refs/heads/ prefix from branch names', () => {
      const result = adapter.mapEventToGameAction('git.pullrequest.created', basePrWebhook, 'user-123');
      expect((result as any)?.context?.pullRequest?.branch).toBe('feature/add-x');
      expect((result as any)?.context?.pullRequest?.baseBranch).toBe('main');
    });

    it('should calculate timeToMerge from closedDate and creationDate', () => {
      const mergedPr: AzurePullRequestWebhook = {
        ...basePrWebhook,
        eventType: 'git.pullrequest.merged',
        resource: {
          ...basePrWebhook.resource,
          status: 'completed',
          creationDate: '2024-01-01T00:00:00Z',
          closedDate: '2024-01-01T01:00:00Z',
        },
      };
      const result = adapter.mapEventToGameAction('git.pullrequest.merged', mergedPr, 'user-123');
      expect((result as any)?.metrics?.timeToMerge).toBe(3600);
    });

    it('should map PR updated with abandoned status to pull_request_close', () => {
      const abandonedPr: AzurePullRequestWebhook = {
        ...basePrWebhook,
        eventType: 'git.pullrequest.updated',
        resource: {
          ...basePrWebhook.resource,
          status: 'abandoned',
          closedDate: '2024-01-02T00:00:00Z',
        },
      };
      const result = adapter.mapEventToGameAction('git.pullrequest.updated', abandonedPr, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('pull_request_close');
    });

    it('should map PR updated with completed status to pull_request_merge', () => {
      const completedPr: AzurePullRequestWebhook = {
        ...basePrWebhook,
        eventType: 'git.pullrequest.updated',
        resource: {
          ...basePrWebhook.resource,
          status: 'completed',
          closedDate: '2024-01-02T00:00:00Z',
        },
      };
      const result = adapter.mapEventToGameAction('git.pullrequest.updated', completedPr, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('pull_request_merge');
    });

    it('should skip PR updated with active status', () => {
      const activePr: AzurePullRequestWebhook = {
        ...basePrWebhook,
        eventType: 'git.pullrequest.updated',
        resource: {
          ...basePrWebhook.resource,
          status: 'active',
        },
      };
      const result = adapter.mapEventToGameAction('git.pullrequest.updated', activePr, 'user-123');

      expect((result as any)?.skipReason).toContain('not eligible for rewards');
    });

    it('should use closedBy as externalUser for merged PRs when available', () => {
      const mergedPr: AzurePullRequestWebhook = {
        ...basePrWebhook,
        eventType: 'git.pullrequest.merged',
        resource: {
          ...basePrWebhook.resource,
          status: 'completed',
          closedDate: '2024-01-02T00:00:00Z',
          closedBy: {
            id: 'merger-guid',
            displayName: 'Merger User',
            uniqueName: 'merger@example.com',
          },
        },
      };
      const result = adapter.mapEventToGameAction('git.pullrequest.merged', mergedPr, 'user-123');

      expect((result as any)?.externalUser?.id).toBe('merger-guid');
      expect((result as any)?.externalUser?.username).toBe('merger@example.com');
    });

    it('should fall back to createdBy as externalUser when closedBy is absent', () => {
      const result = adapter.mapEventToGameAction('git.pullrequest.created', basePrWebhook, 'user-123');

      expect((result as any)?.externalUser?.id).toBe('user-guid-456');
      expect((result as any)?.externalUser?.username).toBe('test@example.com');
    });
  });
});
