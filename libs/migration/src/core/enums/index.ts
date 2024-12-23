/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
export enum FirestoreCollections {
  GAMES = "games",
  USERS = "users",
  TEAMS = "teams",
  EMPLOYEES = "employees",
}

export enum Scores {
  GitHubDistinctCommit = 1,
  GitHubPullRequestOpened = 2,
  GitHubPullRequestClosed = 2,
  GitHubPullRequestMerged = 1,
  GitHubPRReviewSubmitted = 1,
  GitHubPRReviewSubmittedApproved = 1,
  GitHubIssueOpened = 1,
  GitHubIssueClosed = 1,
  GitHubRelease = 4,
  TravisBuildPassed = 2,
  TravisBuildFailed = -3,
  TravisBuildErrored = -3,
  TravisBuildCanceled = 0,
}

import { lib } from "../../../shared/core";
export import GameState = lib.codeheroes.enums.GameState;
