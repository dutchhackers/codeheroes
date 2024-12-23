import { User } from "./user";

export class Review {
  id: number;
  user: User;
  state: string;
  submittedAt: string;

  constructor(payload: any) {
    if (payload === null) {
      return null;
    }
    this.id = payload.id;
    this.user = User.fromPayload(payload.user);
    this.state = payload.state;
    this.submittedAt = payload.submitted_at;
  }

  static fromPayload(payload): Review {
    if (payload === null || payload === undefined) {
      return null;
    }
    return Object.assign({}, new Review(payload));
  }
}
