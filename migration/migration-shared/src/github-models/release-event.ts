import { User } from './user';
import { Repository } from './repository';
import { Release } from './release';

export class ReleaseEvent {
  action: string;
  release: Release;
  repository: Repository;
  organization: any;
  sender: User;

  constructor(payload: any) {
    this.action = payload.action;
    this.release = Release.fromPayload(payload.release);

    this.repository = Repository.fromPayload(payload.repository);
    this.sender = User.fromPayload(payload.sender);
  }
}
