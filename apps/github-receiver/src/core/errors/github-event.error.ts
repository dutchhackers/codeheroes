export class UnsupportedEventError extends Error {
  constructor(eventTypeOrAction: string) {
    super(`Unsupported event: ${eventTypeOrAction}`);
    this.name = 'UnsupportedEventError';
  }
}

export class GitHubEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubEventError';
  }
}

export class GitHubValidationError extends GitHubEventError {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubValidationError';
  }
}
