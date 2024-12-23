import { User } from "./user";
import { Repository } from "./repository";
import { CheckRun } from "./check-run";

export class CheckRunEvent {
  action: string;
  checkRun: CheckRun;
  repository: Repository;
  sender: User;

  constructor(payload: any) {
    this.action = payload.action;
    this.checkRun = CheckRun.fromPayload(payload.check_run);

    this.repository = Repository.fromPayload(payload.repository);
    this.sender = User.fromPayload(payload.sender);
  }

  log() {
    console.log(
      `[GitHub Checks] [CheckRun ${this.action}] [${this.checkRun.appName}] [${this.sender.login}] [${this.repository.fullName}] [${this.checkRun.status}, conclusion: ${this.checkRun.conclusion}]`
    );
  }
}
