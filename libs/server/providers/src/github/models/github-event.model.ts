import { GithubPushEventData } from './push-event.model';
import { GithubPullRequestEventData } from './pull-request-event.model';
import { GithubIssueEventData } from './issue-event.model';
import { GithubPullRequestReviewEventData } from './pull-request-review-event.model';
import { GithubPullRequestReviewThreadEventData } from './pull-request-review-thread-event.model';
import { GithubPullRequestReviewCommentEventData } from './pull-request-review-comment-event.model';
import { GithubCreateEventData } from './create-event.model';
import { GithubDeleteEventData } from './delete-event.model';

export interface GitHubEventData {
  push?: GithubPushEventData;
  pullRequest?: GithubPullRequestEventData;
  issue?: GithubIssueEventData;
  pullRequestReview?: GithubPullRequestReviewEventData;
  pullRequestReviewThread?: GithubPullRequestReviewThreadEventData;
  pullRequestReviewComment?: GithubPullRequestReviewCommentEventData;
  create?: GithubCreateEventData;
  delete?: GithubDeleteEventData;
}
