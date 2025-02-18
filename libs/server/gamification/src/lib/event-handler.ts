import { DatabaseService, logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { GithubPullRequestEventData, GithubPushEventData } from '@codeheroes/providers';
import { GameAction } from './types';

export class EventHandler {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  async handleNewEvent(event: Event): Promise<GameAction | null> {
    const userId = await this.databaseService.lookupUserId({
      sender: (event.data as any)?.sender,
      repository: (event.data as any)?.repository,
    });

    if (!userId) {
      logger.warn('Skipping game action creation - no matching user found', {
        eventType: event.source.event,
      });
      return null;
    }

    logger.info('Handling new event', event);

    switch (event.source.event) {
      case 'push':
        return this.handlePushEvent(event, userId);
      case 'pull_request':
        return this.handlePullRequestEvent(event, userId);
      default:
        return null;
    }
  }

  private handlePushEvent(event: Event, userId: string): GameAction | null {
    const data = event.data as GithubPushEventData;
    if (!data || !data.commits || !Array.isArray(data.commits)) {
      return null;
    }

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
    if (!data || !data.metrics || !data.action) {
      return null;
    }

    switch (data.action) {
      case 'opened':
        return {
          userId,
          actionType: 'pull_request_create',
          metadata: {
            additions: data.metrics.additions,
            deletions: data.metrics.deletions,
            changedFiles: data.metrics.changedFiles,
          },
        };
      case 'closed':
        if (data.merged) {
          return {
            userId,
            actionType: 'pull_request_merge',
            metadata: {
              additions: data.metrics.additions,
              deletions: data.metrics.deletions,
              changedFiles: data.metrics.changedFiles,
            },
          };
        } else {
          return {
            userId,
            actionType: 'pull_request_close',
            metadata: {
              additions: data.metrics.additions,
              deletions: data.metrics.deletions,
              changedFiles: data.metrics.changedFiles,
            },
          };
        }
      default:
        return null;
    }
  }
}
