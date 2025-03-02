import {
  CodePushContext,
  CodePushMetrics,
  CodeReviewContext,
  CodeReviewMetrics,
  GameAction,
  PullRequestContext,
  PullRequestMetrics,
} from '@codeheroes/shared/types';
import { PullRequestEvent, PullRequestReviewEvent, PushEvent } from '../../providers/github/github.interfaces';

export class GitHubMapper {
  static mapEventToGameAction(eventType: string, eventData: any, userId: string): Partial<GameAction> | null {
    switch (eventType) {
      case 'push':
        return this.mapCodePushEvent(eventData as PushEvent, userId);
      case 'pull_request_review':
        return this.mapReviewEvent(eventData as PullRequestReviewEvent, userId);
      case 'pull_request':
        return this.mapPullRequestEvent(eventData as PullRequestEvent, userId);
      default:
        return null;
    }
  }

  private static mapCodePushEvent(data: PushEvent, userId: string): Partial<GameAction> | null {
    // Return null with skip reason if there are no commits
    if (!data.commits || data.commits.length === 0) {
      return {
        skipReason: 'No commits in push event',
      } as any;
    }

    const context: CodePushContext = {
      type: 'code_push',
      provider: 'github',
      repository: {
        id: String(data.repository.id), // Convert number to string
        name: data.repository.name,
        owner: data.repository.owner.login, // Use owner.login from GitHubUser
      },
      branch: data.ref.replace('refs/heads/', ''), // Extract branch name from ref
      commits: data.commits.map((commit) => ({
        id: commit.id,
        message: commit.message,
        timestamp: commit.timestamp,
        author: {
          name: commit.author.name,
          email: commit.author.email,
          ...(commit.author.username && { username: commit.author.username }),
        },
        ...(commit.committer && {
          committer: {
            name: commit.committer.name,
            email: commit.committer.email,
            ...(commit.committer.username && { username: commit.committer.username }),
          },
        }),
      })),
      isNew: data.created,
      isDeleted: data.deleted,
      isForced: data.forced,
    };

    const actionMetrics: CodePushMetrics = {
      type: 'code_push',
      timestamp: data.commits[0]?.timestamp || new Date().toISOString(),
      commitCount: data.commits.length, // Use actual commit count from the array
    };

    return {
      userId,
      externalId: data.ref, // Use data.ref instead of event.ref
      provider: 'github',
      type: 'code_push',
      timestamp: actionMetrics.timestamp,
      externalUser: {
        id: String(data.sender.id), // Convert number to string
        username: data.sender.login,
      },
      context,
      metrics: actionMetrics,
    };
  }

  private static mapReviewEvent(event: PullRequestReviewEvent, userId: string): Partial<GameAction> {
    const context: CodeReviewContext = {
      type: 'code_review',
      provider: 'github',
      repository: {
        id: String(event.repository.id),
        name: event.repository.name,
        owner: event.repository.owner.login,
      },
      pullRequest: {
        id: String(event.pull_request.id),
        number: event.pull_request.number,
        title: event.pull_request.title,
      },
      review: {
        id: String(event.review.id),
        state: event.review.state,
      },
    };

    const actionMetrics: CodeReviewMetrics = {
      type: 'code_review',
      timestamp: event.review.submitted_at,
      commentsCount: 0, // Will need to be calculated from review content
      threadCount: 0, // Not available in webhook payload
      filesReviewed: 0, // Not available in webhook payload
      suggestionsCount: 0, // Would need to parse review comments
      timeToReview: 0, // Would need additional context
      thoroughness: 0, // Would need additional context
    };

    return {
      userId,
      externalId: String(event.review.id),
      provider: 'github',
      type: 'code_review_submit',
      timestamp: event.review.submitted_at,
      externalUser: {
        id: String(event.review.user.id),
        username: event.review.user.login,
      },
      context,
      metrics: actionMetrics,
    };
  }

  private static mapPullRequestEvent(event: PullRequestEvent, userId: string): Partial<GameAction> {
    const context: PullRequestContext = {
      type: 'pull_request',
      provider: 'github',
      repository: {
        id: String(event.repository.id),
        name: event.repository.name,
        owner: event.repository.owner.login,
      },
      pullRequest: {
        id: String(event.pull_request.id),
        number: event.pull_request.number,
        title: event.pull_request.title,
        branch: event.pull_request.head.ref,
        baseBranch: event.pull_request.base.ref,
      },
    };

    const metrics: PullRequestMetrics = {
      type: 'pull_request',
      timestamp: event.pull_request.updated_at,
      commits: event.pull_request.commits,
      additions: event.pull_request.additions,
      deletions: event.pull_request.deletions,
      changedFiles: event.pull_request.changed_files,
      comments: event.pull_request.comments,
      reviewers: event.pull_request.requested_reviewers?.length || 0,
      timeToMerge: event.pull_request.merged_at
        ? this.calculateTimeDifference(event.pull_request.created_at, event.pull_request.merged_at)
        : 0,
    };

    const type =
      event.action === 'closed' && event.pull_request.merged
        ? 'pull_request_merge'
        : event.action === 'closed'
          ? 'pull_request_close'
          : 'pull_request_create';

    return {
      userId,
      externalId: String(event.pull_request.id),
      provider: 'github',
      type,
      timestamp: event.pull_request.updated_at,
      externalUser: {
        id: String(event.sender.id),
        username: event.sender.login,
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
