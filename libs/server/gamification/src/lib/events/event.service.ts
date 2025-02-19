import { Event } from '@codeheroes/event';
import { GithubEventHandler } from './handlers/github.handler';
import { GameAction } from '../core/interfaces/action';

export class EventService {
  private githubHandler: GithubEventHandler;

  constructor() {
    this.githubHandler = new GithubEventHandler();
  }

  async handleNewEvent(event: Event): Promise<GameAction | null> {
    switch (event.provider) {
      case 'github':
        return await this.githubHandler.handleEvent(event);
      default:
        return null;
    }
  }
}
