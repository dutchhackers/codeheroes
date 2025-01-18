import { Character } from '../models/character';
import { CoreService } from './abstract-service';
// import { Character } from "../models";

const CHARACTERS_COLLECTION = 'team-characters';

export interface ICharacterService {
  getCharacter(id: string): Promise<Character>;
  getCharacters(): Promise<Character[]>;
}

export class CharacterService extends CoreService implements ICharacterService {
  constructor() {
    super();
  }

  async getCharacter(id: string): Promise<Character> {
    if (!id) {
      return null;
    }

    const docRef = this.db.collection(CHARACTERS_COLLECTION).doc(id);
    return this.getDocumentAsObject<Character>(docRef, Character);
  }

  async getCharacters(): Promise<Character[]> {
    const snapshot = await this.db.collection(CHARACTERS_COLLECTION).get();
    return this.wrapAll<Character>(snapshot);
  }
}
