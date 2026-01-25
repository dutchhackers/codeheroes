import { GitHubAdapter } from './github.adapter';
describe('GitHubAdapter', () => {
  let adapter: GitHubAdapter;
  beforeEach(() => {
    adapter = new GitHubAdapter();
  });
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
