export class CheckSuite {
  id: number;
  status: string;
  conclusion: string;
  appId: number;
  appName: string;

  constructor(payload: any) {
    this.id = payload.id;
    this.status = payload.status;
    this.conclusion = payload.conclusion;

    const app = payload.app || {};
    this.appId = app.id;
    this.appName = app.name;
  }

  static fromPayload(payload): CheckSuite {
    if (payload === null) {
      return null;
    }
    return Object.assign({}, new CheckSuite(payload));
  }
}
