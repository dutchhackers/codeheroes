import { Author } from './author';

export class Commit {
  id: string;
  message: string;
  committer: Author;
  author: Author;
  distinct: boolean;
  timestamp: Date;
  modified: string[];
  added: string[];
  removed: string[];

  constructor(payload: any) {
    if (payload === null) {
      // throw error?
      return null;
    }
    this.id = payload.id;
    this.distinct = !!payload.distinct;
    this.message = payload.message;
    this.committer = Author.fromPayload(payload.committer);
    this.author = Author.fromPayload(payload.author);
    this.timestamp = payload.timestamp;
    this.modified = payload.modified;
    this.added = payload.added;
    this.removed = payload.removed;
  }

  static fromPayload(payload): Commit {
    if (payload === null) {
      return null;
    }
    return Object.assign({}, new Commit(payload));
  }
}
