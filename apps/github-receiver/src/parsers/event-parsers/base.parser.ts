import { CommonMappedData, CommonPayload, GitHubRepository, GitHubUser } from '../../core/interfaces/github.interfaces';

export abstract class GitHubParser<T extends CommonPayload, R extends CommonMappedData> {
  protected mapCommonProperties(payload: T): CommonMappedData {
    const mapped: CommonMappedData = {};

    if (payload.repository) {
      mapped.repository = this.mapRepository(payload.repository);
    }

    if (payload.sender) {
      mapped.sender = this.mapUser(payload.sender);
    }

    return mapped;
  }

  protected mapRepository(repository: GitHubRepository) {
    return {
      id: repository.id.toString(),
      name: repository.name,
      owner: repository.owner.login,
      ownerType: repository.owner.type,
    };
  }

  protected mapUser(user: GitHubUser) {
    return {
      id: user.id.toString(),
      login: user.login,
    };
  }

  parse(payload: T): R {
    const commonProperties = this.mapCommonProperties(payload);
    return {
      ...commonProperties,
      ...this.parseSpecific(payload),
    } as R;
  }

  protected abstract parseSpecific(payload: T): Omit<R, keyof CommonMappedData>;
}
