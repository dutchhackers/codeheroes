import { PullRequest } from "./pull-request";
import { User } from "./user";
import { Repository } from "./repository";
import { Review } from "./review";

export class PullRequestReviewEvent {
  action: string;
  review: Review;
  pullRequest: PullRequest;
  repository: Repository;
  organization: any;
  sender: User;

  constructor(payload: any) {
    this.action = payload.action;
    this.review = Review.fromPayload(payload.review);
    this.pullRequest = PullRequest.fromPayload(payload.pull_request);

    this.repository = Repository.fromPayload(payload.repository);
    this.sender = User.fromPayload(payload.sender);
  }
}
