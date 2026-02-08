import { BitbucketAdapter } from '../adapter';
import { BitbucketPushWebhook, BitbucketPullRequestWebhook } from '../types';

describe('BitbucketAdapter', () => {
  let adapter: BitbucketAdapter;

  beforeEach(() => {
    adapter = new BitbucketAdapter();
  });

  describe('validateWebhook', () => {
    it('should validate a valid Bitbucket webhook', () => {
      const result = adapter.validateWebhook(
        { 'x-event-key': 'repo:push', 'x-request-uuid': 'uuid-123' },
        {},
      );
      expect(result.isValid).toBe(true);
      expect(result.eventType).toBe('repo:push');
      expect(result.eventId).toBe('uuid-123');
    });

    it('should reject when headers are missing', () => {
      const result = adapter.validateWebhook({}, {});
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required');
    });

    it('should reject when x-event-key is missing', () => {
      const result = adapter.validateWebhook(
        { 'x-request-uuid': 'uuid-123' },
        {},
      );
      expect(result.isValid).toBe(false);
    });

    it('should reject when x-request-uuid is missing', () => {
      const result = adapter.validateWebhook(
        { 'x-event-key': 'repo:push' },
        {},
      );
      expect(result.isValid).toBe(false);
    });

    it('should validate correct HMAC signature when secret is set', () => {
      const secret = 'my-webhook-secret';
      const body = { test: 'data' };
      const rawBody = JSON.stringify(body);

      const { createHmac } = require('crypto');
      const expectedSig = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');

      const result = adapter.validateWebhook(
        {
          'x-event-key': 'repo:push',
          'x-request-uuid': 'uuid-123',
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
        { 'x-event-key': 'repo:push', 'x-request-uuid': 'uuid-123' },
        {},
        'my-secret',
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing webhook signature header');
    });

    it('should reject when signature is invalid', () => {
      const result = adapter.validateWebhook(
        {
          'x-event-key': 'repo:push',
          'x-request-uuid': 'uuid-123',
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
    it('should extract actor.account_id', () => {
      const result = adapter.extractUserId({
        actor: { account_id: '557058:abc-123', display_name: 'Test', nickname: 'test', uuid: '{uuid}' },
      });
      expect(result).toBe('557058:abc-123');
    });

    it('should return undefined when actor is missing', () => {
      expect(adapter.extractUserId({})).toBeUndefined();
    });

    it('should return undefined for null payload', () => {
      expect(adapter.extractUserId(null)).toBeUndefined();
    });
  });

  describe('mapEventToGameAction - push events', () => {
    const basePushWebhook: BitbucketPushWebhook = {
      actor: {
        account_id: '557058:abc-123',
        display_name: 'Test User',
        nickname: 'testuser',
        uuid: '{user-uuid}',
      },
      repository: {
        uuid: '{repo-uuid}',
        name: 'my-repo',
        full_name: 'myworkspace/my-repo',
        workspace: { slug: 'myworkspace', name: 'My Workspace', uuid: '{ws-uuid}' },
      },
      push: {
        changes: [
          {
            new: {
              type: 'branch',
              name: 'main',
              target: {
                hash: 'abc123def456',
                date: '2024-01-01T00:00:00+00:00',
                message: 'Initial commit',
                author: { raw: 'Test User <test@example.com>' },
              },
            },
            old: {
              type: 'branch',
              name: 'main',
              target: { hash: '000000' },
            },
            created: false,
            closed: false,
            forced: false,
            commits: [
              {
                hash: 'abc123def456',
                message: 'Initial commit',
                date: '2024-01-01T00:00:00+00:00',
                author: { raw: 'Test User <test@example.com>' },
              },
            ],
          },
        ],
      },
    };

    it('should map push event to code_push action', () => {
      const result = adapter.mapEventToGameAction('repo:push', basePushWebhook, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('code_push');
      expect((result as any)?.userId).toBe('user-123');
      expect((result as any)?.provider).toBe('bitbucket');
      expect((result as any)?.context?.branch).toBe('main');
      expect((result as any)?.context?.commits).toHaveLength(1);
      expect((result as any)?.context?.repository?.name).toBe('my-repo');
      expect((result as any)?.context?.repository?.owner).toBe('myworkspace');
    });

    it('should parse author name and email from raw format', () => {
      const result = adapter.mapEventToGameAction('repo:push', basePushWebhook, 'user-123');
      const commits = (result as any)?.context?.commits;
      expect(commits[0].author).toEqual({ name: 'Test User', email: 'test@example.com' });
    });

    it('should skip push with no changes', () => {
      const emptyPush = {
        ...basePushWebhook,
        push: { changes: [] },
      };
      const result = adapter.mapEventToGameAction('repo:push', emptyPush, 'user-123');
      expect((result as any)?.skipReason).toBe('Push contains no changes');
    });

    it('should skip push with no commits', () => {
      const noCommits = {
        ...basePushWebhook,
        push: {
          changes: [{
            ...basePushWebhook.push.changes[0],
            commits: [],
          }],
        },
      };
      const result = adapter.mapEventToGameAction('repo:push', noCommits, 'user-123');
      expect((result as any)?.skipReason).toBe('Push contains no commits');
    });

    it('should return null for unknown event types', () => {
      const result = adapter.mapEventToGameAction('unknown:event', basePushWebhook, 'user-123');
      expect(result).toBeNull();
    });
  });

  describe('mapEventToGameAction - pull request events', () => {
    const basePrWebhook: BitbucketPullRequestWebhook = {
      actor: {
        account_id: '557058:abc-123',
        display_name: 'Test User',
        nickname: 'testuser',
        uuid: '{user-uuid}',
      },
      repository: {
        uuid: '{repo-uuid}',
        name: 'my-repo',
        full_name: 'myworkspace/my-repo',
        workspace: { slug: 'myworkspace', name: 'My Workspace', uuid: '{ws-uuid}' },
      },
      pullrequest: {
        id: 42,
        title: 'Add feature X',
        description: 'This adds feature X',
        state: 'OPEN',
        created_on: '2024-01-01T00:00:00+00:00',
        updated_on: '2024-01-01T00:00:00+00:00',
        close_source_branch: false,
        author: {
          account_id: '557058:abc-123',
          display_name: 'Test User',
          nickname: 'testuser',
          uuid: '{user-uuid}',
        },
        source: {
          branch: { name: 'feature/add-x' },
          repository: {
            uuid: '{repo-uuid}',
            name: 'my-repo',
            full_name: 'myworkspace/my-repo',
            workspace: { slug: 'myworkspace', name: 'My Workspace', uuid: '{ws-uuid}' },
          },
        },
        destination: {
          branch: { name: 'main' },
          repository: {
            uuid: '{repo-uuid}',
            name: 'my-repo',
            full_name: 'myworkspace/my-repo',
            workspace: { slug: 'myworkspace', name: 'My Workspace', uuid: '{ws-uuid}' },
          },
        },
        comment_count: 3,
        task_count: 1,
      },
    };

    it('should map PR created event to pull_request_create', () => {
      const result = adapter.mapEventToGameAction('pullrequest:created', basePrWebhook, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('pull_request_create');
      expect((result as any)?.userId).toBe('user-123');
      expect((result as any)?.provider).toBe('bitbucket');
      expect((result as any)?.context?.pullRequest?.title).toBe('Add feature X');
      expect((result as any)?.context?.pullRequest?.branch).toBe('feature/add-x');
      expect((result as any)?.context?.pullRequest?.baseBranch).toBe('main');
    });

    it('should map PR fulfilled event to pull_request_merge', () => {
      const mergedPr: BitbucketPullRequestWebhook = {
        ...basePrWebhook,
        pullrequest: {
          ...basePrWebhook.pullrequest,
          state: 'MERGED',
          updated_on: '2024-01-02T00:00:00+00:00',
        },
      };
      const result = adapter.mapEventToGameAction('pullrequest:fulfilled', mergedPr, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('pull_request_merge');
    });

    it('should calculate timeToMerge for merged PRs', () => {
      const mergedPr: BitbucketPullRequestWebhook = {
        ...basePrWebhook,
        pullrequest: {
          ...basePrWebhook.pullrequest,
          state: 'MERGED',
          created_on: '2024-01-01T00:00:00+00:00',
          updated_on: '2024-01-01T01:00:00+00:00',
        },
      };
      const result = adapter.mapEventToGameAction('pullrequest:fulfilled', mergedPr, 'user-123');
      expect((result as any)?.metrics?.timeToMerge).toBe(3600);
    });

    it('should include comment count in metrics', () => {
      const result = adapter.mapEventToGameAction('pullrequest:created', basePrWebhook, 'user-123');
      expect((result as any)?.metrics?.comments).toBe(3);
    });
  });
});
