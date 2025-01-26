import { User } from './user';
import { Commit } from './commit';

export class Push {
  repository: string;
  user?: User;
  authorName: string;
  headCommit: Commit;
  commits: Commit[];

  constructor(payload: any) {
    if (payload === null) {
      // throw error?
      return null;
    }
    this.repository = payload.repository.full_name;
    this.user = User.fromPayload(payload.sender);
    this.authorName = payload.head_commit.author.name;
    this.headCommit = Commit.fromPayload(payload.head_commit);
    this.commits = payload.commits === null ? [] : payload.commits.map((c) => Commit.fromPayload(c));
  }

  get distinctCommits(): Commit[] {
    return this.commits.filter((p) => p.distinct === true);
  }

  static fromPayload(payload): Push {
    if (payload === null) {
      return null;
    }
    return new Push(payload);
  }
}
