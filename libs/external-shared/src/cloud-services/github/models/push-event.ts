import * as logger from 'firebase-functions/logger';

import { Push } from './push';
import { Repository } from './repository';
import { User } from './user';
// import { LookupService } from "../../../../libs/core/services/lookup-service";
// import { Employee } from "../../../../libs/core/models";

// TODO: fix lookupService imports
// import { LookupService } from '../../services/lookup-service';
// import { Employee } from 'code-heroes-shared';

export class PushEvent {
  push: Push;
  repository: Repository;
  organization: any;
  sender: User;

  constructor(payload: any) {
    this.push = Push.fromPayload(payload);

    this.repository = Repository.fromPayload(payload.repository);
    this.sender = User.fromPayload(payload.sender);

    logger.info('PushEvent', this.push, { structuredData: true });
    logger.info('PushEvent', this.repository, { structuredData: true });
    logger.info('PushEvent', this.sender, { structuredData: true });
  }

  /*

  async resolveEventArguments(db: any): Promise<any> {
    if (!db) {
      return Promise.resolve(null);
    }
    Promise.resolve(null);

    const lookupService = new LookupService();

    // type: PushEventArgs
    const args: any = {
      repo: this.repository.fullName,
      counters: <any>{},
      commits: [],
    };

    const sender = await lookupService.findEmployeeByGithubLogin(this.sender.login);
    if (sender) {
      args.user = sender.email;
    }

    args.counters.totalCommits = this.push.commits.length;
    args.counters.distinctCommits = this.push.distinctCommits.length;

    const _commits = [];
    for (const commit of this.push.distinctCommits) {
      let user: Employee;

      if (commit.committer.username && commit.committer.username !== "web-flow") {
        user = await lookupService.findEmployeeByGithubLogin(commit.committer.username);
      } else {
        user = await lookupService.findEmployeeFromTravis({
          authorName: commit.author.name,
          authorEmail: commit.author.email,
        });
      }

      _commits.push({
        id: commit.id,
        user: user ? user.email : null,
        message: commit.message,
        timestamp: commit.timestamp,
      });
    }

    args.commits = _commits;

    return args;
  }

  */
}
