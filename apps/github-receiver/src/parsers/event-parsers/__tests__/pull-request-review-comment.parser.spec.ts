import { PullRequestReviewCommentParser } from '../pull-request-review-comment.parser';
import { PullRequestReviewCommentEvent } from '../../../core/interfaces/github.interfaces';

describe('PullRequestReviewCommentParser', () => {
  let parser: PullRequestReviewCommentParser;
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
    parser = new PullRequestReviewCommentParser();
  });

  it('should parse new comment event', () => {
    const payload: PullRequestReviewCommentEvent = {
      action: 'created',
      comment: {
        id: 789,
        body: 'Great improvement!',
        created_at: '2023-01-01T12:00:00Z',
        updated_at: '2023-01-01T12:00:00Z',
        line: 5,
        path: 'src/index.ts',
        position: 5,
        commit_id: 'abc123',
        pull_request_review_id: 456,
        user: {
          id: 101,
          login: 'commenter',
          avatar_url: 'https://github.com/commenter.png',
          html_url: 'https://github.com/commenter',
          type: 'User',
        },
        html_url: 'https://github.com/org/test-repo/pull/123#discussion_r789',
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
        login: 'commenter',
        avatar_url: 'https://github.com/commenter.png',
        html_url: 'https://github.com/commenter',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);

    expect(result).toEqual({
      action: 'created',
      prNumber: 123,
      prTitle: 'Feature: Add new functionality',
      comment: {
        id: 789,
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z',
        inReplyToId: undefined,
      },
      author: {
        id: '101',
        login: 'commenter',
      },
      repository: {
        id: '123',
        name: 'test-repo',
        owner: 'org',
        ownerType: 'Organization',
      },
      sender: {
        id: '101',
        login: 'commenter',
      },
    });
  });

  it('should parse reply comment event', () => {
    const payload: PullRequestReviewCommentEvent = {
      action: 'created',
      comment: {
        id: 789,
        body: 'Thanks for the feedback!',
        created_at: '2023-01-01T12:00:00Z',
        updated_at: '2023-01-01T12:00:00Z',
        line: 5,
        path: 'src/index.ts',
        position: 5,
        commit_id: 'abc123',
        pull_request_review_id: 456,
        in_reply_to_id: 456,
        user: {
          id: 101,
          login: 'commenter',
          avatar_url: 'https://github.com/commenter.png',
          html_url: 'https://github.com/commenter',
          type: 'User',
        },
        html_url: 'https://github.com/org/test-repo/pull/123#discussion_r789',
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
        login: 'commenter',
        avatar_url: 'https://github.com/commenter.png',
        html_url: 'https://github.com/commenter',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);

    expect(result).toEqual({
      action: 'created',
      prNumber: 123,
      prTitle: 'Feature: Add new functionality',
      comment: {
        id: 789,
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z',
        inReplyToId: 456,
      },
      author: {
        id: '101',
        login: 'commenter',
      },
      repository: {
        id: '123',
        name: 'test-repo',
        owner: 'org',
        ownerType: 'Organization',
      },
      sender: {
        id: '101',
        login: 'commenter',
      },
    });
  });
});
