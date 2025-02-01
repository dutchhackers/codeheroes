export interface Repository {
  id: string;
  name: string;
  owner: string;
  ownerType: 'User' | 'Organization';
}

export interface Sender {
  id: string;
  login: string;
}

export interface GitHubBaseEventData extends Record<string, unknown> {
  sender: Sender;
  repository: Repository;
  lastCommitMessage?: string;
}
