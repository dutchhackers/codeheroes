import { DeleteEventParser } from '../delete.parser';
import { DeleteEvent } from '../../../core/interfaces/github.interfaces';

describe('DeleteEventParser', () => {
  let parser: DeleteEventParser;
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
    parser = new DeleteEventParser();
  });

  it('should parse branch deletion event', () => {
    const payload: DeleteEvent = {
      ref: 'feature/old-branch',
      ref_type: 'branch',
      pusher_type: 'user',
      repository: mockRepository,
      sender: {
        id: 789,
        login: 'developer',
        avatar_url: 'https://github.com/developer.png',
        html_url: 'https://github.com/developer',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);

    expect(result).toEqual({
      ref: 'feature/old-branch',
      refType: 'branch',
      pusherType: 'user',
      repository: {
        id: '123',
        name: 'test-repo',
        owner: 'org',
        ownerType: 'Organization',
      },
      sender: {
        id: '789',
        login: 'developer',
      },
    });
  });

  it('should parse tag deletion event', () => {
    const payload: DeleteEvent = {
      ref: 'v1.0.0',
      ref_type: 'tag',
      pusher_type: 'user',
      repository: mockRepository,
      sender: {
        id: 789,
        login: 'developer',
        avatar_url: 'https://github.com/developer.png',
        html_url: 'https://github.com/developer',
        type: 'User' as const,
      },
    };

    const result = parser.parse(payload);

    expect(result).toEqual({
      ref: 'v1.0.0',
      refType: 'tag',
      pusherType: 'user',
      repository: {
        id: '123',
        name: 'test-repo',
        owner: 'org',
        ownerType: 'Organization',
      },
      sender: {
        id: '789',
        login: 'developer',
      },
    });
  });
});
