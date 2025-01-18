import { User } from './user';
export class Issue {
  id: number;
  number: number;
  title: string;
  user: User;
  // labels: any[];
  state: string;
  assignee?: User;
  assignees: User[];
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  comments: number;

  constructor(payload: any) {
    if (payload === null) {
      return null;
    }
    this.id = payload.id;
    this.number = payload.number;
    this.title = payload.title;
    this.user = User.fromPayload(payload.user);
    this.state = payload.state;
    this.assignee = User.fromPayload(payload.assignee);
    this.assignees = payload.assignees === null ? [] : payload.assignees.map((p) => User.fromPayload(p));
    this.createdAt = payload.created_at;
    this.updatedAt = payload.updated_at;
    this.closedAt = payload.closed_at;
    this.comments = payload.comments;
  }

  static fromPayload(payload): Issue {
    if (payload === null || payload === undefined) {
      return null;
    }
    return Object.assign({}, new Issue(payload));
  }
}
