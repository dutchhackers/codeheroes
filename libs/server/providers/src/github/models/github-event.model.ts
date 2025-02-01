import { PushEventData } from './push-event.model';
import { PullRequestEventData } from './pull-request-event.model';
import { IssueEventData } from './issue-event.model';

export interface GitHubEventData {
  push?: PushEventData;
  pullRequest?: PullRequestEventData;
  issue?: IssueEventData;
}
