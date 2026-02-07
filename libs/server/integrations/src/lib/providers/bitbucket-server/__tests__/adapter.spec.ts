import { BitbucketServerAdapter } from '../adapter';
import { BitbucketServerPushWebhook, BitbucketServerPullRequestWebhook } from '../types';

describe('BitbucketServerAdapter', () => {
  let adapter: BitbucketServerAdapter;

  beforeEach(() => {
    adapter = new BitbucketServerAdapter();
  });

  describe('validateWebhook', () => {
    it('should validate a valid Bitbucket Server webhook', () => {
      const result = adapter.validateWebhook(
        { 'x-event-key': 'repo:refs_changed', 'x-request-id': 'req-123' },
        {},
      );
      expect(result.isValid).toBe(true);
      expect(result.eventType).toBe('repo:refs_changed');
      expect(result.eventId).toBe('req-123');
    });

    it('should use eventKey from body when x-request-id is missing', () => {
      const result = adapter.validateWebhook(
        { 'x-event-key': 'repo:refs_changed' },
        { eventKey: 'repo:refs_changed' },
      );
      expect(result.isValid).toBe(true);
      expect(result.eventId).toBe('repo:refs_changed');
    });

    it('should reject when x-event-key is missing', () => {
      const result = adapter.validateWebhook({}, {});
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required');
    });

    it('should validate correct HMAC signature when secret is set', () => {
      const secret = 'my-webhook-secret';
      const body = { test: 'data' };
      const rawBody = JSON.stringify(body);

      const { createHmac } = require('crypto');
      const expectedSig = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');

      const result = adapter.validateWebhook(
        {
          'x-event-key': 'repo:refs_changed',
          'x-request-id': 'req-123',
          'x-hub-signature': expectedSig,
        },
        body,
        secret,
        rawBody,
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject when secret is set but signature header is missing', () => {
      const result = adapter.validateWebhook(
        { 'x-event-key': 'repo:refs_changed', 'x-request-id': 'req-123' },
        {},
        'my-secret',
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing webhook signature header');
    });

    it('should reject when signature is invalid', () => {
      const result = adapter.validateWebhook(
        {
          'x-event-key': 'repo:refs_changed',
          'x-request-id': 'req-123',
          'x-hub-signature': 'sha256=invalid',
        },
        { test: 'data' },
        'my-secret',
        '{"test":"data"}',
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid webhook signature');
    });
  });

  describe('extractUserId', () => {
    it('should extract actor.id as string', () => {
      const result = adapter.extractUserId({
        actor: { id: 12345, name: 'testuser', emailAddress: 'test@example.com', displayName: 'Test', slug: 'testuser' },
      });
      expect(result).toBe('12345');
    });

    it('should return undefined when actor is missing', () => {
      expect(adapter.extractUserId({})).toBeUndefined();
    });

    it('should return undefined for null payload', () => {
      expect(adapter.extractUserId(null)).toBeUndefined();
    });
  });

  describe('mapEventToGameAction - push events', () => {
    const basePushWebhook: BitbucketServerPushWebhook = {
      eventKey: 'repo:refs_changed',
      date: '2024-01-01T00:00:00+0000',
      actor: {
        id: 12345,
        name: 'testuser',
        emailAddress: 'test@example.com',
        displayName: 'Test User',
        slug: 'testuser',
      },
      repository: {
        id: 1,
        slug: 'my-repo',
        name: 'my-repo',
        project: { id: 10, key: 'PROJ', name: 'My Project' },
      },
      changes: [
        {
          ref: { id: 'refs/heads/main', displayId: 'main', type: 'BRANCH' },
          refId: 'refs/heads/main',
          fromHash: '000000',
          toHash: 'abc123def456',
          type: 'UPDATE',
        },
      ],
      commits: [
        {
          id: 'abc123def456',
          displayId: 'abc123d',
          message: 'Initial commit',
          authorTimestamp: 1704067200000,
          author: { name: 'Test User', emailAddress: 'test@example.com' },
          committer: { name: 'Test User', emailAddress: 'test@example.com' },
        },
      ],
    };

    it('should map push event to code_push action', () => {
      const result = adapter.mapEventToGameAction('repo:refs_changed', basePushWebhook, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('code_push');
      expect((result as any)?.userId).toBe('user-123');
      expect((result as any)?.provider).toBe('bitbucket_server');
      expect((result as any)?.context?.branch).toBe('main');
      expect((result as any)?.context?.commits).toHaveLength(1);
      expect((result as any)?.context?.repository?.name).toBe('my-repo');
      expect((result as any)?.context?.repository?.owner).toBe('PROJ');
    });

    it('should map commit details including committer', () => {
      const result = adapter.mapEventToGameAction('repo:refs_changed', basePushWebhook, 'user-123');
      const commits = (result as any)?.context?.commits;
      expect(commits[0].author).toEqual({ name: 'Test User', email: 'test@example.com' });
      expect(commits[0].committer).toEqual({ name: 'Test User', email: 'test@example.com' });
    });

    it('should skip push with no changes', () => {
      const emptyPush = { ...basePushWebhook, changes: [] };
      const result = adapter.mapEventToGameAction('repo:refs_changed', emptyPush, 'user-123');
      expect((result as any)?.skipReason).toBe('Push contains no changes');
    });

    it('should handle push without commits gracefully', () => {
      const noCommits = { ...basePushWebhook, commits: undefined };
      const result = adapter.mapEventToGameAction('repo:refs_changed', noCommits, 'user-123');
      expect((result as any)?.context?.commits).toHaveLength(0);
      expect((result as any)?.metrics?.commitCount).toBe(0);
    });

    it('should detect new branch creation', () => {
      const newBranch = {
        ...basePushWebhook,
        changes: [{ ...basePushWebhook.changes[0], type: 'ADD' as const }],
      };
      const result = adapter.mapEventToGameAction('repo:refs_changed', newBranch, 'user-123');
      expect((result as any)?.context?.isNew).toBe(true);
    });

    it('should detect branch deletion', () => {
      const deletedBranch = {
        ...basePushWebhook,
        changes: [{ ...basePushWebhook.changes[0], type: 'DELETE' as const }],
      };
      const result = adapter.mapEventToGameAction('repo:refs_changed', deletedBranch, 'user-123');
      expect((result as any)?.context?.isDeleted).toBe(true);
    });

    it('should return null for unknown event types', () => {
      const result = adapter.mapEventToGameAction('unknown:event', basePushWebhook, 'user-123');
      expect(result).toBeNull();
    });
  });

  describe('mapEventToGameAction - pull request events', () => {
    const basePrWebhook: BitbucketServerPullRequestWebhook = {
      eventKey: 'pr:opened',
      date: '2024-01-01T00:00:00+0000',
      actor: {
        id: 12345,
        name: 'testuser',
        emailAddress: 'test@example.com',
        displayName: 'Test User',
        slug: 'testuser',
      },
      pullRequest: {
        id: 42,
        title: 'Add feature X',
        description: 'This adds feature X',
        state: 'OPEN',
        createdDate: 1704067200000,
        updatedDate: 1704067200000,
        fromRef: {
          id: 'refs/heads/feature/add-x',
          displayId: 'feature/add-x',
          repository: {
            id: 1,
            slug: 'my-repo',
            name: 'my-repo',
            project: { id: 10, key: 'PROJ', name: 'My Project' },
          },
        },
        toRef: {
          id: 'refs/heads/main',
          displayId: 'main',
          repository: {
            id: 1,
            slug: 'my-repo',
            name: 'my-repo',
            project: { id: 10, key: 'PROJ', name: 'My Project' },
          },
        },
        author: {
          user: {
            id: 12345,
            name: 'testuser',
            emailAddress: 'test@example.com',
            displayName: 'Test User',
            slug: 'testuser',
          },
          role: 'AUTHOR',
        },
        reviewers: [],
        properties: { commentCount: 5 },
      },
    };

    it('should map PR opened event to pull_request_create', () => {
      const result = adapter.mapEventToGameAction('pr:opened', basePrWebhook, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('pull_request_create');
      expect((result as any)?.userId).toBe('user-123');
      expect((result as any)?.provider).toBe('bitbucket_server');
      expect((result as any)?.context?.pullRequest?.title).toBe('Add feature X');
      expect((result as any)?.context?.pullRequest?.branch).toBe('feature/add-x');
      expect((result as any)?.context?.pullRequest?.baseBranch).toBe('main');
    });

    it('should map PR merged event to pull_request_merge', () => {
      const mergedPr: BitbucketServerPullRequestWebhook = {
        ...basePrWebhook,
        eventKey: 'pr:merged',
        pullRequest: {
          ...basePrWebhook.pullRequest,
          state: 'MERGED',
          closedDate: 1704153600000,
        },
      };
      const result = adapter.mapEventToGameAction('pr:merged', mergedPr, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('pull_request_merge');
    });

    it('should calculate timeToMerge from closedDate and createdDate', () => {
      const mergedPr: BitbucketServerPullRequestWebhook = {
        ...basePrWebhook,
        eventKey: 'pr:merged',
        pullRequest: {
          ...basePrWebhook.pullRequest,
          state: 'MERGED',
          createdDate: 1704067200000,
          closedDate: 1704070800000, // +1 hour
        },
      };
      const result = adapter.mapEventToGameAction('pr:merged', mergedPr, 'user-123');
      expect((result as any)?.metrics?.timeToMerge).toBe(3600);
    });

    it('should include comment count and reviewer count in metrics', () => {
      const prWithReviewers: BitbucketServerPullRequestWebhook = {
        ...basePrWebhook,
        pullRequest: {
          ...basePrWebhook.pullRequest,
          reviewers: [
            {
              user: {
                id: 99,
                name: 'reviewer1',
                emailAddress: 'r1@example.com',
                displayName: 'Reviewer 1',
                slug: 'reviewer1',
              },
              role: 'REVIEWER',
              approved: true,
            },
          ],
        },
      };
      const result = adapter.mapEventToGameAction('pr:opened', prWithReviewers, 'user-123');
      expect((result as any)?.metrics?.comments).toBe(5);
      expect((result as any)?.metrics?.reviewers).toBe(1);
    });
  });
});
