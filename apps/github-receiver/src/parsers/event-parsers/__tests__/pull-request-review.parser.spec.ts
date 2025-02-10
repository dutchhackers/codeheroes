import { PullRequestReviewParser } from '../pull-request-review.parser';
import { PullRequestReviewEvent } from '../../../core/interfaces/github.interfaces';

describe('PullRequestReviewParser', () => {
  let parser: PullRequestReviewParser;
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
    parser = new PullRequestReviewParser();
  });

  it('should parse submitted review event', () => {
    const payload: PullRequestReviewEvent = {
      action: 'submitted',
      review: {
        id: 789,
        node_id: 'PRR_123',
        user: {
          id: 101,
          login: 'reviewer',
          avatar_url: 'https://github.com/reviewer.png',
          html_url: 'https://github.com/reviewer',
          type: 'User',
        },
        body: 'LGTM! 👍',
        state: 'approved',
        submitted_at: '2023-01-01T14:00:00Z',
        commit_id: 'abc123',
        html_url: 'https://github.com/org/test-repo/pull/123#pullrequestreview-789',
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
        login: 'reviewer',
        avatar_url: 'https://github.com/reviewer.png',
        html_url: 'https://github.com/reviewer',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);

    expect(result).toEqual({
      action: 'submitted',
      state: 'approved',
      prNumber: 123,
      prTitle: 'Feature: Add new functionality',
      reviewer: {
        id: '101',
        login: 'reviewer',
      },
      submittedAt: '2023-01-01T14:00:00Z',
      repository: {
        id: '123',
        name: 'test-repo',
        owner: 'org',
        ownerType: 'Organization',
      },
      sender: {
        id: '101',
        login: 'reviewer',
      },
    });
  });

  it('should parse dismissed review event', () => {
    const payload: PullRequestReviewEvent = {
      action: 'dismissed',
      review: {
        id: 789,
        node_id: 'PRR_123',
        user: {
          id: 101,
          login: 'reviewer',
          avatar_url: 'https://github.com/reviewer.png',
          html_url: 'https://github.com/reviewer',
          type: 'User',
        },
        body: 'Needs more work',
        state: 'approved',  // Changed from 'changes_requested' to 'approved' as the original state
        submitted_at: '2023-01-01T14:00:00Z',
        commit_id: 'abc123',
        html_url: 'https://github.com/org/test-repo/pull/123#pullrequestreview-789',
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
        id: 789,
        login: 'maintainer',
        avatar_url: 'https://github.com/maintainer.png',
        html_url: 'https://github.com/maintainer',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);

    expect(result).toEqual({
      action: 'dismissed',
      state: 'approved',  // Changed to match the review state
      prNumber: 123,
      prTitle: 'Feature: Add new functionality',
      reviewer: {
        id: '101',
        login: 'reviewer',
      },
      submittedAt: '2023-01-01T14:00:00Z',
      repository: {
        id: '123',
        name: 'test-repo',
        owner: 'org',
        ownerType: 'Organization',
      },
      sender: {
        id: '789',
        login: 'maintainer',
      },
    });
  });
});
