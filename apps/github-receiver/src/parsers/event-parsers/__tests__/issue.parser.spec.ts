import { IssueParser } from '../issue.parser';
import { IssueEvent } from '../../../core/interfaces/github.interfaces';

describe('IssueParser', () => {
  let parser: IssueParser;
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
    parser = new IssueParser();
  });

  it('should parse opened issue event', () => {
    const payload: IssueEvent = {
      action: 'opened',
      issue: {
        id: 789,
        number: 123,
        title: 'Bug: Something is not working',
        state: 'open',
        state_reason: null,
        user: {
          id: 789,
          login: 'reporter',
          avatar_url: 'https://github.com/reporter.png',
          html_url: 'https://github.com/reporter',
          type: 'User',
        },
        created_at: '2023-01-01T12:00:00Z',
        updated_at: '2023-01-01T12:00:00Z',
        closed_at: null,
        body: 'This is a bug report',
        html_url: 'https://github.com/org/test-repo/issues/123',
      },
      repository: mockRepository,
      sender: {
        id: 789,
        login: 'reporter',
        avatar_url: 'https://github.com/reporter.png',
        html_url: 'https://github.com/reporter',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);

    expect(result).toEqual({
      action: 'opened',
      issueNumber: 123,
      title: 'Bug: Something is not working',
      state: 'open',
      stateReason: null,
      repository: {
        id: '123',
        name: 'test-repo',
        owner: 'org',
        ownerType: 'Organization',
      },
      sender: {
        id: '789',
        login: 'reporter',
      },
    });
  });

  it('should parse closed issue event', () => {
    const payload: IssueEvent = {
      action: 'closed',
      issue: {
        id: 789,
        number: 123,
        title: 'Bug: Something is not working',
        state: 'closed',
        state_reason: 'completed',
        user: {
          id: 789,
          login: 'reporter',
          avatar_url: 'https://github.com/reporter.png',
          html_url: 'https://github.com/reporter',
          type: 'User',
        },
        created_at: '2023-01-01T12:00:00Z',
        updated_at: '2023-01-02T12:00:00Z',
        closed_at: '2023-01-02T12:00:00Z',
        body: 'This is a bug report',
        html_url: 'https://github.com/org/test-repo/issues/123',
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
      action: 'closed',
      issueNumber: 123,
      title: 'Bug: Something is not working',
      state: 'closed',
      stateReason: 'completed',
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
