import { Repository } from "./repository";
import { BuildState } from "./travis-build-state";

export class TravisBuildEvent {
  id: string;
  number: string;
  config: any;
  type: string;
  state: BuildState;
  status: number;
  result: number;
  statusMessage: string;
  resultMessage: string;
  startedAt: string;
  finishedAt: string;
  duration: number;
  commitId: number;
  commit: string;
  message: string;
  authorName: string;
  authorEmail: string;
  committerName: string;
  committerEmail: string;
  pullRequest: boolean;
  pullRequestNumber?: number;
  repository: Repository;
  matrix: any[];

  constructor(payload: any) {
    this.id = payload.id;
    this.number = payload.number;
    this.type = payload.type;
    this.state = payload.state;
    this.status = payload.status;
    this.result = payload.result;
    this.statusMessage = payload.status_message;
    this.resultMessage = payload.result_message;
    this.startedAt = payload.started_at;
    this.finishedAt = payload.finished_at;
    this.duration = payload.duration;
    this.commitId = payload.commit_id;
    this.commit = payload.commit;
    this.message = payload.message;
    this.authorName = payload.author_name;
    this.authorEmail = payload.author_email;
    this.committerName = payload.committer_name;
    this.committerEmail = payload.committer_email;
    this.pullRequest = payload.pull_request;
    this.pullRequestNumber = payload.pull_request_number;
    this.repository = Repository.fromPayload(payload.repository);
  }
}
