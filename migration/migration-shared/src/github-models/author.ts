export class Author {
  name: string;
  username?: string;
  email: string;

  constructor(payload: any) {
    if (payload === null) {
      return null;
    }
    this.name = payload.name;
    this.username = payload.username;
    this.email = payload.email;
  }

  static fromPayload(payload): Author {
    if (payload === null || payload === undefined) {
      return null;
    }
    return Object.assign({}, new Author(payload));
  }
}
