import { GitHubAdapter } from './github.adapter';

describe('GitHubAdapter', () => {
  let adapter: GitHubAdapter;

  beforeEach(() => {
    adapter = new GitHubAdapter();
  });

  describe('validateWebhook', () => {
    it('should validate GitHub webhook', () => {
      const headers = {
        'x-github-event': 'push',
        'x-github-delivery': '123456',
      };
      const result = adapter.validateWebhook(headers, {});
      expect(result.isValid).toBe(true);
      expect(result.eventType).toBe('push');
      expect(result.eventId).toBe('123456');
    });
  });

  describe('mapEventToGameAction - pull_request events', () => {
    const basePullRequestEvent = {
      repository: {
        id: 123,
        name: 'test-repo',
        owner: { login: 'test-owner' },
      },
      pull_request: {
        id: 456,
        number: 1,
        title: 'Test PR',
        head: { ref: 'feature-branch' },
        base: { ref: 'main' },
        commits: 1,
        additions: 10,
        deletions: 5,
        changed_files: 2,
        comments: 0,
        requested_reviewers: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        merged_at: null,
        merged: false,
      },
      sender: { id: 789, login: 'test-user' },
    };

    it('should map "opened" action to pull_request_create', () => {
      const event = { ...basePullRequestEvent, action: 'opened' };
      const result = adapter.mapEventToGameAction('pull_request', event, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('pull_request_create');
      expect((result as any)?.userId).toBe('user-123');
    });

    it('should map "closed" action with merged=true to pull_request_merge', () => {
      const event = {
        ...basePullRequestEvent,
        action: 'closed',
        pull_request: {
          ...basePullRequestEvent.pull_request,
          merged: true,
          merged_at: '2024-01-01T01:00:00Z',
        },
      };
      const result = adapter.mapEventToGameAction('pull_request', event, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('pull_request_merge');
    });

    it('should map "closed" action with merged=false to pull_request_close', () => {
      const event = {
        ...basePullRequestEvent,
        action: 'closed',
        pull_request: {
          ...basePullRequestEvent.pull_request,
          merged: false,
        },
      };
      const result = adapter.mapEventToGameAction('pull_request', event, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('pull_request_close');
    });

    it('should skip "synchronize" action with skipReason', () => {
      const event = { ...basePullRequestEvent, action: 'synchronize' };
      const result = adapter.mapEventToGameAction('pull_request', event, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBeUndefined();
      expect((result as any)?.skipReason).toBe("Pull request action 'synchronize' not tracked for XP gains");
    });

    it('should skip "edited" action with skipReason', () => {
      const event = { ...basePullRequestEvent, action: 'edited' };
      const result = adapter.mapEventToGameAction('pull_request', event, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBeUndefined();
      expect((result as any)?.skipReason).toBe("Pull request action 'edited' not tracked for XP gains");
    });

    it('should skip "reopened" action with skipReason', () => {
      const event = { ...basePullRequestEvent, action: 'reopened' };
      const result = adapter.mapEventToGameAction('pull_request', event, 'user-123');

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBeUndefined();
      expect((result as any)?.skipReason).toBe("Pull request action 'reopened' not tracked for XP gains");
    });
  });
});
