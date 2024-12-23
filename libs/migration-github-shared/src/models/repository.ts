export class Repository {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  language: string;
  defaultBranch: string;

  constructor(payload: any) {
    if (payload === null) {
      return null;
    }
    this.id = payload.id;
    this.name = payload.name;
    this.fullName = payload.full_name;
    this.private = payload.private;
    this.language = payload.language;
    this.defaultBranch = payload.default_branch;
  }

  static fromPayload(payload): Repository {
    if (payload === null || payload === undefined) {
      return null;
    }
    return Object.assign({}, new Repository(payload));
  }
}
