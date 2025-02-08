import { CreateParser } from '../create.parser';
import { CreateEvent } from '../../../core/interfaces/github.interfaces';

describe('CreateParser', () => {
  let parser: CreateParser;
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
    parser = new CreateParser();
  });

  it('should parse branch creation event', () => {
    const payload: CreateEvent = {
      ref: 'feature/new-branch',
      ref_type: 'branch',
      master_branch: 'main',
      description: null,
      pusher_type: 'user',
      repository: mockRepository,
      sender: {
        id: 789,
        login: 'user1',
        avatar_url: 'https://github.com/user1.png',
        html_url: 'https://github.com/user1',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);

    expect(result).toEqual({
      ref: 'feature/new-branch',
      refType: 'branch',
      masterBranch: 'main',
      pusherType: 'user',
      repository: {
        id: '123',
        name: 'test-repo',
        owner: 'org',
        ownerType: 'Organization',
      },
      sender: {
        id: '789',
        login: 'user1',
      },
    });
  });

  it('should return null for non-branch creation events', () => {
    const payload: CreateEvent = {
      ref: 'v1.0.0',
      ref_type: 'tag',
      master_branch: 'main',
      description: null,
      pusher_type: 'user',
      repository: mockRepository,
      sender: {
        id: 789,
        login: 'user1',
        avatar_url: 'https://github.com/user1.png',
        html_url: 'https://github.com/user1',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);
    expect(result).toBeNull();
  });
});
