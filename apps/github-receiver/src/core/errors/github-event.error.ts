export class UnsupportedEventError extends Error {
  constructor(eventType: string) {
    super(`Unknown event type: ${eventType}`);
    this.name = 'UnsupportedEventError';
  }
}

export class GitHubEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubEventError';
  }
}
