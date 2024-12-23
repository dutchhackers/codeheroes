import { PullRequest } from "./pull-request";
import { User } from "./user";
import { Repository } from "./repository";

export class PullRequestEvent {
  action: string;
  number: number;

  pullRequest: PullRequest;
  repository: Repository;
  organization: any;
  sender: User;

  // repository: string;
  // userRef: string;
  // title: string;
  // event: string = 'pull_request';
  // authorName: string;
  // createdAt: string;

  constructor(payload: any) {
    this.action = payload.action;
    this.number = payload.number;
    this.pullRequest = PullRequest.fromPayload(payload.pull_request);

    this.repository = Repository.fromPayload(payload.repository);
    this.sender = User.fromPayload(payload.sender);
  }
}
