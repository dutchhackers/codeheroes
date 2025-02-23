import { DatabaseService, logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { GithubPullRequestEventData, GithubPushEventData } from '@codeheroes/providers';
import { GameAction } from '../../core/interfaces/action';

export class GithubEventHandler {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  async handleEvent(event: Event): Promise<GameAction | null> {
    const userId = await this.databaseService.lookupUserId({
      sender: (event.data as any)?.sender,
      repository: (event.data as any)?.repository,
    });

    if (!userId) {
      logger.warn('No matching user found for GitHub event', {
        eventType: event.source.event,
      });
      return null;
    }

    switch (event.source.event) {
      case 'push':
        return this.handlePushEvent(event, userId);
      case 'pull_request':
        return this.handlePullRequestEvent(event, userId);
      case 'pull_request_review':
        return this.handlePullRequestReviewEvent(event, userId);
      default:
        return null;
    }
  }

  private handlePushEvent(event: Event, userId: string): GameAction | null {
    const data = event.data as GithubPushEventData;
    if (!data?.commits?.length) return null;

    return {
      userId,
      actionType: 'code_push',
      metadata: {
        commits: data.commits.length,
      },
    };
  }

  private handlePullRequestEvent(event: Event, userId: string): GameAction | null {
    const data = event.data as GithubPullRequestEventData;
    if (!data?.metrics || !data.action) return null;

    const metrics = {
      additions: data.metrics.additions,
      deletions: data.metrics.deletions,
      changedFiles: data.metrics.changedFiles,
    };

    switch (data.action) {
      case 'opened':
        return {
          userId,
          actionType: 'pull_request_create',
          metadata: metrics,
        };
      case 'closed':
        return {
          userId,
          actionType: data.merged ? 'pull_request_merge' : 'pull_request_close',
          metadata: metrics,
        };
      default:
        return null;
    }
  }

  private handlePullRequestReviewEvent(event: Event, userId: string): GameAction | null {
    const data = event.data as any;
    if (!data.action) return null;

    // Only process completed reviews
    if (data.action !== 'submitted') return null;

    const metadata = {
      commentCount: 0, // to be implemented later,
      filesReviewed: 0, // data.pull_request?.changed_files || 1,
      suggestions: 0, // to be implemented later
      state: data.review?.state,
    };

    return {
      userId,
      actionType: 'code_review_submit',
      metadata,
    };
  }
}
