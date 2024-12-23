import { User } from "./user";
import { Repository } from "./repository";
import { Issue } from "./issue";

export class IssueEvent {
  action: string;
  issue: Issue;
  repository: Repository;
  organization: any;
  sender: User;

  constructor(payload: any) {
    this.action = payload.action;
    this.issue = Issue.fromPayload(payload.issue);

    this.repository = Repository.fromPayload(payload.repository);
    this.sender = User.fromPayload(payload.sender);
  }
}
