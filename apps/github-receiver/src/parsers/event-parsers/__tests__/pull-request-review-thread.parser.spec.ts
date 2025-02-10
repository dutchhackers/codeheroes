import { PullRequestReviewThreadParser } from '../pull-request-review-thread.parser';
import { PullRequestReviewThreadEvent } from '../../../core/interfaces/github.interfaces';

describe('PullRequestReviewThreadParser', () => {
  let parser: PullRequestReviewThreadParser;
  const mockRepository = {
    id: 123,
    name: 'test-repo',
    full_name: 'org/test-repo',
    private: false,
    html_url: 'https://github.com/org/test-repo',
    description: 'Test repository',
    owner: {
      id: 456,
      login: 'org',
      avatar_url: 'https://github.com/avatar.png',
      html_url: 'https://github.com/org',
      type: 'Organization' as const,
    },
  };

  beforeEach(() => {
    parser = new PullRequestReviewThreadParser();
  });

  it('should parse resolved thread event', () => {
    const payload: PullRequestReviewThreadEvent = {
      action: 'resolved',
      thread: {
        id: 789,
        node_id: 'thread_123',
        comments: 2,
        resolved: true,
        resolution: {
          user: {
            id: 101,
            login: 'resolver',
            avatar_url: 'https://github.com/resolver.png',
            html_url: 'https://github.com/resolver',
            type: 'User',
          },
          commit_id: 'abc123'
        },
        line: 42,
        start_line: 40,
        original_line: 38,
      },
      pull_request: {
        id: 456,
        number: 123,
        title: 'Feature: Add new functionality',
        state: 'open',
        html_url: 'https://github.com/org/test-repo/pull/123',
      },
      repository: mockRepository,
      sender: {
        id: 101,
        login: 'resolver',
        avatar_url: 'https://github.com/resolver.png',
        html_url: 'https://github.com/resolver',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);

    expect(result).toEqual({
      action: 'resolved',
      prNumber: 123,
      prTitle: 'Feature: Add new functionality',
      threadId: 789,
      resolved: true,
      resolver: {
        id: '101',
        login: 'resolver',
      },
      lineDetails: {
        line: 42,
        startLine: 40,
        originalLine: 38,
      },
      repository: {
        id: '123',
        name: 'test-repo',
        owner: 'org',
        ownerType: 'Organization',
      },
      sender: {
        id: '101',
        login: 'resolver',
      },
    });
  });

  it('should parse unresolved thread event', () => {
    const payload: PullRequestReviewThreadEvent = {
      action: 'unresolved',
      thread: {
        id: 789,
        node_id: 'thread_123',
        comments: 3,
        resolved: false,
        line: 42,
        start_line: 40,
        original_line: 38,
      },
      pull_request: {
        id: 456,
        number: 123,
        title: 'Feature: Add new functionality',
        state: 'open',
        html_url: 'https://github.com/org/test-repo/pull/123',
      },
      repository: mockRepository,
      sender: {
        id: 101,
        login: 'user',
        avatar_url: 'https://github.com/user.png',
        html_url: 'https://github.com/user',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);

    expect(result).toEqual({
      action: 'unresolved',
      prNumber: 123,
      prTitle: 'Feature: Add new functionality',
      threadId: 789,
      resolved: false,
      lineDetails: {
        line: 42,
        startLine: 40,
        originalLine: 38,
      },
      repository: {
        id: '123',
        name: 'test-repo',
        owner: 'org',
        ownerType: 'Organization',
      },
      sender: {
        id: '101',
        login: 'user',
      },
    });
  });
});
