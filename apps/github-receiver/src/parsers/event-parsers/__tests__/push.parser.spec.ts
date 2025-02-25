import { PushParser } from '../push.parser';
import { PushEvent } from '../../../core/interfaces/github.interfaces';

describe('PushParser', () => {
  let parser: PushParser;
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
    parser = new PushParser();
  });

  it('should parse push event with commits', () => {
    const payload: PushEvent = {
      ref: 'refs/heads/main',
      before: '123abc',
      after: 'def456',
      created: false,
      deleted: false,
      forced: false,
      compare: 'https://github.com/org/test-repo/compare/123abc...def456',
      commits: [
        {
          id: 'abc123',
          message: 'feat: add new feature',
          timestamp: '2023-01-01T12:00:00Z',
          url: 'https://github.com/org/test-repo/commit/abc123',
          author: {
            name: 'John Doe',
            email: 'john@example.com',
            username: 'johndoe',
          },
        },
        {
          id: 'def456',
          message: 'fix: bug fix',
          timestamp: '2023-01-01T13:00:00Z',
          url: 'https://github.com/org/test-repo/commit/def456',
          author: {
            name: 'Jane Doe',
            email: 'jane@example.com',
            username: 'janedoe',
          },
        },
      ],
      head_commit: null,
      pusher: {
        name: 'John Doe',
        email: 'john@example.com',
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
      branch: 'main',
      created: false,
      deleted: false,
      forced: false,
      pusher: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      commits: [
        {
          id: 'abc123',
          message: 'feat: add new feature',
          timestamp: '2023-01-01T12:00:00Z',
          url: 'https://github.com/org/test-repo/commit/abc123',
          author: {
            name: 'John Doe',
            email: 'john@example.com',
            username: 'johndoe',
          },
        },
        {
          id: 'def456',
          message: 'fix: bug fix',
          timestamp: '2023-01-01T13:00:00Z',
          url: 'https://github.com/org/test-repo/commit/def456',
          author: {
            name: 'Jane Doe',
            email: 'jane@example.com',
            username: 'janedoe',
          },
        },
      ],
      metrics: {
        commits: 2,
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

  it('should parse branch creation push event', () => {
    const payload: PushEvent = {
      ref: 'refs/heads/feature/new-branch',
      before: '0000000000000000000000000000000000000000',
      after: 'abc123',
      created: true,
      deleted: false,
      forced: false,
      compare: 'https://github.com/org/test-repo/compare/feature/new-branch',
      commits: [],
      head_commit: null,
      pusher: {
        name: 'John Doe',
        email: 'john@example.com',
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
      branch: 'feature/new-branch',
      created: true,
      deleted: false,
      forced: false,
      pusher: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      commits: [],
      metrics: {
        commits: 0,
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
});
