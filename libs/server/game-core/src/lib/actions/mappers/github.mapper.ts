import { Event } from '@codeheroes/event';
import { GameAction } from '../interfaces/game-action.interface';
import { CodeReviewContext, PullRequestContext } from '../interfaces/context.interface';
import { CodeReviewMetrics, PullRequestMetrics } from '../interfaces/metrics.interface';
import { GithubPullRequestEventData, GithubPullRequestMetrics } from '@codeheroes/providers';

export class GitHubMapper {
  static mapEventToGameAction(event: Event, userId: string): Partial<GameAction> | null {
    switch (event.source.event) {
      case 'pull_request_review':
        return this.mapReviewEvent(event, userId);
      case 'pull_request':
        return this.mapPullRequestEvent(event, userId);
      // Add other event types
      default:
        return null;
    }
  }

  private static mapReviewEvent(event: Event, userId: string): Partial<GameAction> {
    const data = event.data as any;

    const context: CodeReviewContext = {
      type: 'code_review',
      provider: 'github',
      repository: {
        id: data.repository.id,
        name: data.repository.name,
        owner: data.repository.owner.login,
      },
      pullRequest: {
        id: data.pull_request.id,
        number: data.pull_request.number,
        title: data.pull_request.title,
      },
      review: {
        id: data.review.id,
        state: data.review.state,
      },
    };

    const metrics: CodeReviewMetrics = {
      type: 'code_review',
      timestamp: data.review.submitted_at,
      commentsCount: data.review.comments || 0,
      threadCount: data.review.threads || 0,
      filesReviewed: data.pull_request.changed_files,
      suggestionsCount: data.review.suggestions_count || 0,
      timeToReview: this.calculateReviewTime(data),
      thoroughness: this.calculateThoroughness(data),
    };

    return {
      userId,
      externalId: event.source.id,
      provider: 'github',
      type: 'code_review_submit',
      timestamp: data.review.submitted_at,
      externalUser: {
        id: data.sender.id,
        username: data.sender.login,
      },
      context,
      metrics,
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
