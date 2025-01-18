import { CheckSuite } from './check-suite';

export class CheckRun {
  id: number;
  status: string;
  conclusion: string;
  startedAt: string;
  completedAt?: string;
  name: string;

  appId: number;
  appName: string;

  checkSuite: CheckSuite;

  constructor(payload: any) {
    this.id = payload.id;
    this.status = payload.status;
    this.conclusion = payload.conclusion;
    this.startedAt = payload.started_at;
    this.completedAt = payload.completed_at;
    this.name = payload.name;
    const app = payload.app || {};
    this.appId = app.id;
    this.appName = app.name;
    this.checkSuite = CheckSuite.fromPayload(payload.check_suite);
  }

  static fromPayload(payload): CheckRun {
    if (payload === null) {
      return null;
    }
    return Object.assign({}, new CheckRun(payload));
  }
}
