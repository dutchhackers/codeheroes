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

export interface BaseEventData extends Record<string, unknown> {
  repository: Repository;
  lastCommitMessage?: string;
  sender: Sender;
}
