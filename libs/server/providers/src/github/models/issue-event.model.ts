import { GitHubBaseEventData } from './base-event.model';

export type IssueStateReason = 'completed' | 'not_planned' | 'reopened' | null;

export interface GithubIssueEventData extends GitHubBaseEventData {
  action: 'opened' | 'closed' | 'reopened' | 'edited' | string;
  issueNumber: number;
  title: string;
  state: string;
  stateReason?: IssueStateReason;
  //   metrics?: EventMetrics;
}
