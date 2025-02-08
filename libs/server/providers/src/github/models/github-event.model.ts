import { PushEventData } from './push-event.model';
import { PullRequestEventData } from './pull-request-event.model';
import { IssueEventData } from './issue-event.model';
import { PullRequestReviewEventData } from './pull-request-review-event.model';
import { PullRequestReviewThreadEventData } from './pull-request-review-thread-event.model';
import { PullRequestReviewCommentEventData } from './pull-request-review-comment-event.model';
import { CreateEventData } from './create-event.model';
import { DeleteEventData } from './delete-event.model';

export interface GitHubEventData {
  push?: PushEventData;
  pullRequest?: PullRequestEventData;
  issue?: IssueEventData;
  pullRequestReview?: PullRequestReviewEventData;
  pullRequestReviewThread?: PullRequestReviewThreadEventData;
  pullRequestReviewComment?: PullRequestReviewCommentEventData;
  create?: CreateEventData;
  delete?: DeleteEventData;
}
