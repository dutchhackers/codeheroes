import { User } from './user';
import { Repository } from './repository';
import { CheckSuite } from './check-suite';

export class CheckSuiteEvent {
  action: string;
  checkSuite: CheckSuite;
  repository: Repository;
  sender: User;

  constructor(payload: any) {
    this.action = payload.action;
    this.checkSuite = CheckSuite.fromPayload(payload.check_suite);

    this.repository = Repository.fromPayload(payload.repository);
    this.sender = User.fromPayload(payload.sender);
  }

  log() {
    console.log(
      `[GitHub Checks] [CheckSuite ${this.action}] [${this.checkSuite.appName}] [${this.sender.login}] [${this.repository.fullName}] [${this.checkSuite.status}, conclusion: ${this.checkSuite.conclusion}]`
    );
  }
}
