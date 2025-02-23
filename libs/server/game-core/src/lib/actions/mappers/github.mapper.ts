import { Event } from '@codeheroes/event';
import { GameAction, GameActionType } from '../interfaces';

export class GitHubMapper {
  static mapEventToGameAction(event: Event, userId: string): Partial<GameAction> | null {
    const eventData = event.data as any;

    switch (event.source.event) {
      case 'push':
        return {
          userId,
          externalId: event.source.id,
          provider: 'github',
          type: 'code_push' as GameActionType,
          timestamp: eventData.timestamp || new Date().toISOString(),
          externalUser: {
            id: eventData.sender.id,
            username: eventData.sender.login,
          },
          context: {
            repository: {
              id: eventData.repository.id,
              name: eventData.repository.name,
              owner: eventData.repository.owner,
            },
            ref: eventData.ref,
          },
          metrics: {
            commits: eventData.commits?.length || 0,
          },
        };

      case 'pull_request':
        return {
          userId,
          externalId: event.source.id,
          provider: 'github',
          type: GitHubMapper.mapPullRequestActionType(eventData.action, eventData.merged),
          timestamp: eventData.timestamp || new Date().toISOString(),
          externalUser: {
            id: eventData.sender.id,
            username: eventData.sender.login,
          },
          context: {
            repository: {
              id: eventData.repository.id,
              name: eventData.repository.name,
              owner: eventData.repository.owner,
            },
          },
          metrics: {
            additions: eventData.additions,
            deletions: eventData.deletions,
            changedFiles: eventData.changed_files,
          },
        };

      default:
        return null;
    }
  }

  private static mapPullRequestActionType(action: string, merged: boolean): GameActionType {
    if (action === 'closed' && merged) return 'pull_request_merge';
    if (action === 'closed') return 'pull_request_close';
    if (action === 'opened') return 'pull_request_create';
    return 'pull_request_create';
  }
}
