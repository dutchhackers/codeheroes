import { User } from "./user";

export class PullRequest {
  id: number;
  title: string;
  repository: string;
  user?: User;
  assignee?: User;
  assignees: User[];
  mergedBy?: User;

  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  mergedAt?: string;

  comments: number;
  reviewComments: number;
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;

  constructor(payload: any) {
    if (payload === null) {
      // throw error?
      return null;
    }
    this.user = User.fromPayload(payload.user);
    this.title = payload.title;
    this.assignee = User.fromPayload(payload.assignee);
    this.assignees = payload.assignees === null ? [] : payload.assignees.map(p => User.fromPayload(p));
    this.mergedBy = User.fromPayload(payload.merged_by);

    this.createdAt = payload.created_at;
    this.updatedAt = payload.updated_at;
    this.closedAt = payload.closed_at;
    this.mergedAt = payload.merged_at;

    this.comments = payload.comments || 0;
    this.reviewComments = payload.review_comments || 0;
    this.commits = payload.commits || 0;
    this.additions = payload.additions || 0;
    this.deletions = payload.deletions || 0;
    this.changedFiles = payload.changed_files || 0;
  }

  get hasUser(): boolean {
    return this.user !== null;
  }

  get hasMergedBy(): boolean {
    return this.mergedBy !== null;
  }

  static fromPayload(payload): PullRequest {
    if (payload === null) {
      return null;
    }
    return Object.assign({}, new PullRequest(payload));
  }
}
