export class User {
  login: string;
  id: number;
  avatarUrl: string;
  type: string;

  constructor(payload: any) {
    if (payload === null) {
      return null;
    }
    this.login = payload.login;
    this.id = payload.id;
    this.avatarUrl = payload.avatar_url;
    this.type = "User";
  }

  static fromPayload(payload): User {
    if (payload === null || payload === undefined) {
      return null;
    }
    return Object.assign({}, new User(payload));
  }
}
