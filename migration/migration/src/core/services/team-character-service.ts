import { CoreService } from './abstract-service';
import { Character } from '../models';

const CHARACTERS_COLLECTION = 'team-characters';

export interface ITeamCharacterService {
  getCharacters(): Promise<Character[]>;
}

export class TeamCharacterService extends CoreService implements ITeamCharacterService {
  constructor() {
    super();
  }

  async getCharacters(): Promise<Character[]> {
    const snapshot = await this.db.collection(CHARACTERS_COLLECTION).get();
    return this.wrapAll<Character>(snapshot);
  }
}
