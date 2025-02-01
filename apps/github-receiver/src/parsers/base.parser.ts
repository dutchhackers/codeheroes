export abstract class GitHubParser<T, R> {
  abstract parse(payload: T): R;
}
