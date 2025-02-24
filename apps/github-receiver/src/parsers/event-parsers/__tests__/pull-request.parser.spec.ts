import { PullRequestParser } from '../pull-request.parser';
import { PullRequestEvent } from '../../../core/interfaces/github.interfaces';

describe('PullRequestParser', () => {
  let parser: PullRequestParser;
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

  const mockBase = {
    ref: 'main',
    sha: 'base-sha',
    user: {
      id: 456,
      login: 'org',
      avatar_url: 'https://github.com/org.png',
      html_url: 'https://github.com/org',
      type: 'Organization' as const,
    },
    repo: mockRepository,
  };

  const mockHead = {
    ref: 'feature/new-feature',
    sha: 'head-sha',
    user: {
      id: 789,
      login: 'johndoe',
      avatar_url: 'https://github.com/johndoe.png',
      html_url: 'https://github.com/johndoe',
      type: 'User' as const,
    },
    repo: mockRepository,
  };

  beforeEach(() => {
    parser = new PullRequestParser();
  });

  it('should parse opened pull request event', () => {
    const payload: PullRequestEvent = {
      action: 'opened',
      number: 123,
      pull_request: {
        id: 456,
        number: 123,
        state: 'open',
        title: 'Feature: Add new functionality',
        merged: false,
        draft: false,
        created_at: '2023-01-01T12:00:00Z',
        updated_at: '2023-01-01T12:00:00Z',
        commits: 3,
        additions: 100,
        deletions: 50,
        changed_files: 5,
        comments: 0,
        html_url: 'https://github.com/org/test-repo/pull/123',
        merged_at: null,
        merged_by: null,
        head: mockHead,
        base: mockBase,
      },
      repository: mockRepository,
      sender: {
        id: 789,
        login: 'johndoe',
        avatar_url: 'https://github.com/johndoe.png',
        html_url: 'https://github.com/johndoe',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);

    expect(result).toEqual({
      action: 'opened',
      prNumber: 123,
      title: 'Feature: Add new functionality',
      branch: 'feature/new-feature',
      baseBranch: 'main',
      state: 'open',
      merged: false,
      draft: false,
      createdAt: '2023-01-01T12:00:00Z',
      updatedAt: '2023-01-01T12:00:00Z',
      metrics: {
        commits: 3,
        additions: 100,
        deletions: 50,
        changedFiles: 5,
        comments: 0,
        reviewers: 0,
      },
      repository: {
        id: '123',
        name: 'test-repo',
        owner: 'org',
        ownerType: 'Organization',
      },
      sender: {
        id: '789',
        login: 'johndoe',
      },
    });
  });

  it('should parse merged pull request event', () => {
    const payload: PullRequestEvent = {
      action: 'closed',
      number: 123,
      pull_request: {
        id: 456,
        number: 123,
        state: 'closed',
        title: 'Feature: Add new functionality',
        merged: true,
        draft: false,
        created_at: '2023-01-01T12:00:00Z',
        updated_at: '2023-01-02T12:00:00Z',
        merged_at: '2023-01-02T12:00:00Z',
        merged_by: {
          id: 101,
          login: 'maintainer',
          avatar_url: 'https://github.com/maintainer.png',
          html_url: 'https://github.com/maintainer',
          type: 'User',
        },
        commits: 3,
        additions: 100,
        deletions: 50,
        changed_files: 5,
        comments: 2,
        html_url: 'https://github.com/org/test-repo/pull/123',
        head: mockHead,
        base: mockBase,
      },
      repository: mockRepository,
      sender: {
        id: 101,
        login: 'maintainer',
        avatar_url: 'https://github.com/maintainer.png',
        html_url: 'https://github.com/maintainer',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);

    expect(result).toEqual({
      action: 'closed',
      prNumber: 123,
      title: 'Feature: Add new functionality',
      branch: 'feature/new-feature',
      baseBranch: 'main',
      state: 'closed',
      merged: true,
      draft: false,
      createdAt: '2023-01-01T12:00:00Z',
      updatedAt: '2023-01-02T12:00:00Z',
      mergedAt: '2023-01-02T12:00:00Z',
      mergedBy: {
        id: '101',
        login: 'maintainer',
      },
      metrics: {
        commits: 3,
        additions: 100,
        deletions: 50,
        changedFiles: 5,
        comments: 2,
        reviewers: 0,
      },
      repository: {
        id: '123',
        name: 'test-repo',
        owner: 'org',
        ownerType: 'Organization',
      },
      sender: {
        id: '101',
        login: 'maintainer',
      },
    });
  });
});
