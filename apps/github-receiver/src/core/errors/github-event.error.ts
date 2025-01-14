import { ErrorType } from '../constants/constants';

export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly type: ErrorType = ErrorType.GITHUB_EVENT
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}
