import { User } from "./user";
export class Release {
  id: number;
  name: string;
  tagName: string;
  author: User;
  createdAt: string;
  publishedAt?: string;

  constructor(payload: any) {
    if (payload === null) {
      return null;
    }
    this.id = payload.id;
    this.name = payload.name;
    this.tagName = payload.tag_name;
    this.author = User.fromPayload(payload.author);
    this.createdAt = payload.created_at;
    this.publishedAt = payload.published_at;
  }

  static fromPayload(payload): Release {
    if (payload === null || payload === undefined) {
      return null;
    }
    return Object.assign({}, new Release(payload));
  }
}
