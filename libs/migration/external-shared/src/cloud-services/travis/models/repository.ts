export class Repository {
  id: number;
  name: string;
  fullName: string;

  constructor(payload: any) {
    if (payload === null) {
      return null;
    }
    this.id = payload.id;
    this.name = payload.name;
    this.fullName = payload.owner_name + '/' + payload.name;
  }

  static fromPayload(payload): Repository {
    if (payload === null || payload === undefined) {
      return null;
    }
    return Object.assign({}, new Repository(payload));
  }
}
