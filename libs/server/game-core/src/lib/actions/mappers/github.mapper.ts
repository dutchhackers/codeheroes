import { Event } from '@codeheroes/event';
import {
  GithubPullRequestEventData,
  GithubPullRequestMetrics,
  GithubPullRequestReviewEventData,
  GithubPullRequestReviewMetrics,
  GithubPushEventData,
  GithubPushEventMetrics,
} from '@codeheroes/providers';
import { CodePushContext, CodeReviewContext, PullRequestContext } from '../interfaces/context.interface';
import { GameAction } from '../interfaces/game-action.interface';
import { CodePushMetrics, CodeReviewMetrics, PullRequestMetrics } from '../interfaces/metrics.interface';

export class GitHubMapper {
  static mapEventToGameAction(event: Event, userId: string): Partial<GameAction> | null {
    switch (event.source.event) {
      case 'push':
        return this.mapCodePushEvent(event, userId);
      case 'pull_request_review':
        return this.mapReviewEvent(event, userId);
      case 'pull_request':
        return this.mapPullRequestEvent(event, userId);
      // Add other event types
      default:
        return null;
    }
  }

  private static mapCodePushEvent(event: Event, userId: string): Partial<GameAction> {
    const data = event.data as GithubPushEventData;
    const metrics = data.metrics as GithubPushEventMetrics;

    const context: CodePushContext = {
      type: 'code_push',
      provider: 'github',
      repository: {
        id: data.repository.id,
        name: data.repository.name,
        owner: data.repository.owner,
      },
      branch: data.branch,
      commits: data.commits.map((commit) => ({
        id: commit.id,
        message: commit.message,
        timestamp: commit.timestamp,
        author: {
          name: commit.author.name,
          email: commit.author.email,
        },
      })),
      isNew: data.created,
      isDeleted: data.deleted,
      isForced: data.forced,
    };

    const actionMetrics: CodePushMetrics = {
      type: 'code_push',
      timestamp: data.commits[0]?.timestamp || new Date().toISOString(),
      commitCount: metrics.commits,
    };

    return {
      userId,
      externalId: event.source.id,
      provider: 'github',
      type: 'code_push',
      timestamp: actionMetrics.timestamp,
      externalUser: {
        id: data.sender.id,
        username: data.sender.login,
      },
      context,
      metrics: actionMetrics,
    };
  }

  private static mapReviewEvent(event: Event, userId: string): Partial<GameAction> {
    const data = event.data as GithubPullRequestReviewEventData;
    const metrics = data.metrics as GithubPullRequestReviewMetrics;

    const context: CodeReviewContext = {
      type: 'code_review',
      provider: 'github',
      repository: {
        id: data.repository.id,
        name: data.repository.name,
        owner: data.repository.owner,
      },
      pullRequest: {
        id: data.id,
        number: data.prNumber,
        title: data.prTitle,
      },
      review: {
        id: String(data.prNumber), // Using PR number as review ID since we don't have review ID in the data
        state: data.state,
      },
    };

    const actionMetrics: CodeReviewMetrics = {
      type: 'code_review',
      timestamp: data.submittedAt,
      commentsCount: metrics.commentsCount,
      threadCount: metrics.threadCount,
      filesReviewed: metrics.changedFiles,
      suggestionsCount: metrics.suggestionsCount,
      timeToReview: this.calculateReviewTime(data),
      thoroughness: this.calculateThoroughness(data),
    };

    return {
      userId,
      externalId: event.source.id,
      provider: 'github',
      type: 'code_review_submit',
      timestamp: data.submittedAt,
      externalUser: {
        id: data.reviewer.id,
        username: data.reviewer.login,
      },
      context,
      metrics: actionMetrics,
    };
  }

  private static mapPullRequestEvent(event: Event, userId: string): Partial<GameAction> {
    const data = event.data as GithubPullRequestEventData;
    const dataMetrics = event.data.metrics as GithubPullRequestMetrics;

    const context: PullRequestContext = {
      type: 'pull_request',
      provider: 'github',
      repository: {
        id: data.repository.id,
        name: data.repository.name,
        owner: data.repository.owner,
      },
      pullRequest: {
        id: data.id,
        number: data.prNumber,
        title: data.title,
        branch: data.branch,
        baseBranch: data.baseBranch,
      },
    };

    const metrics: PullRequestMetrics = {
      type: 'pull_request',
      timestamp: data.updatedAt,
      commits: dataMetrics.commits,
      additions: dataMetrics.additions,
      deletions: dataMetrics.deletions,
      changedFiles: dataMetrics.changedFiles,
      comments: dataMetrics.comments,
      reviewers: dataMetrics.reviewers,
      timeToMerge: data.mergedAt ? this.calculateTimeDifference(data.createdAt, data.mergedAt) : 0,
    };

    const type =
      data.action === 'closed' && data.merged
        ? 'pull_request_merge'
        : data.action === 'closed'
          ? 'pull_request_close'
          : 'pull_request_create';

    return {
      userId,
      externalId: event.source.id,
      provider: 'github',
      type,
      timestamp: data.updatedAt,
      externalUser: {
        id: data.sender.id,
        username: data.sender.login,
      },
      context,
      metrics,
    };
  }

  private static calculateReviewTime(data: any): number {
    // Implementation for calculating review time
    // This could involve comparing review submission time with PR creation time
    // or time since review was requested
    return 0; // Placeholder
  }

  private static calculateThoroughness(data: any): number {
    // Implementation for calculating review thoroughness
    // This could factor in:
    // - Number of comments per line of code
    // - Coverage of files reviewed
    // - Depth of comments (measured by length/content)
    // - Number of suggestions made
    return 0; // Placeholder
  }

  private static calculateTimeDifference(start: string, end: string): number {
    return (new Date(end).getTime() - new Date(start).getTime()) / 1000;
  }
}
