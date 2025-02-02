import * as admin from 'firebase-admin';

import { User } from '../models/user';
import { CoreService } from './abstract-service';
import { serialize } from 'serializr';
import { CharacterService } from './character-service';
import { UserXp } from '../models/xp-data';
import { CHARACTERS_COLLECTION } from '../utils/firestore-collections';

const USERS_COLLECTION = '_test_users';
const CHARACTER_SUB_COLLECTION = 'characters';
const XP_SUB_COLLECTION = 'xp-data-log';

export interface CreateUserInput {
  uid?: string;
  name: string;
  email: string;
  photoUrl: string;
  active?: boolean;
}

export interface IUserServiceV2 {
  createUser(data: CreateUserInput): Promise<User>;
  getUser(userId: string): Promise<User>;
  getUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<void>;
  setCharacter(userId: string, characterId: string): Promise<any>;
  saveUserXpData(userId: string, totalXp: number, userXpItems: UserXp[]): Promise<void>;
}

export class UserServiceV2 extends CoreService implements IUserServiceV2 {
  private _characterService: CharacterService;

  constructor() {
    super();

    this._characterService = new CharacterService();
  }

  async createUser(data: CreateUserInput): Promise<User> {
    const defaults = {
      active: false,
    };

    const newUser = Object.assign(new User(), defaults, data);
    newUser.totalScore = 0;
    newUser.totalXp = 0;

    const docRef = this.db.collection(USERS_COLLECTION).doc(newUser.email);
    await this.firebaseSetDocument(docRef, serialize(newUser));
    return this.getUser(newUser.email);
  }

  async getUser(userId: any): Promise<User> {
    if (!userId) {
      return null;
    }

    const docRef = this.db.collection(USERS_COLLECTION).doc(userId);
    return this.getDocumentAsObject<User>(docRef, User);
  }

  async getUsers(): Promise<User[]> {
    const collectionRef = this.db.collection(USERS_COLLECTION);
    return this.getCollectionAsObject<User>(collectionRef, User);
    // return [];
  }

  async deleteUser(userId: string): Promise<void> {
    const docRef = this.db.collection(USERS_COLLECTION).doc(userId);
    await docRef.delete();
  }

  async setCharacter(userId: string, characterId: string): Promise<any> {
    // TODO: check if selected character has already been assigned to somebody else
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('user is null');
    }

    const userRef = this.db.collection(USERS_COLLECTION).doc(userId);
    const characterRef = this.db.collection(CHARACTERS_COLLECTION).doc(characterId);
    let oldCharacterRef;
    if (user.character) {
      oldCharacterRef = this.db.collection(CHARACTERS_COLLECTION).doc(user.character.id);

      if (user.character.id === characterId) {
        // Error: cannot set to already existing character
        throw new Error('old and new character are the same');
      }
    }

    const character = await this._characterService.getCharacter(characterId);
    if (character.assignedBy) {
      // Error: character already  in use
      throw new Error(`Already in use by ${character.assignedBy}`);
    }

    const userCharacterRef = userRef.collection(CHARACTER_SUB_COLLECTION).doc(characterId);
    const userCharacterData = await userCharacterRef.get();

    let userCharacterUpdate: any;
    if (userCharacterData.exists) {
      userCharacterUpdate = Object.assign(userCharacterData.data(), character.asUserCharacterBase());
    } else {
      const defaults = { xp: 0, level: 0, creationDate: new Date().toISOString() };
      userCharacterUpdate = Object.assign(defaults, character.asUserCharacterBase());
    }

    const batch = this.db.batch();
    batch.set(userCharacterRef, userCharacterUpdate, { merge: false });
    batch.set(userRef, { character: userCharacterUpdate }, { merge: true });
    batch.set(characterRef, { assignedBy: userId }, { merge: true });

    if (oldCharacterRef) {
      batch.set(oldCharacterRef, { assignedBy: admin.firestore.FieldValue.delete() }, { merge: true });
    }

    await batch.commit();
  }

  async saveUserXpData(userId: string, totalXp: number, userXpItems: UserXp[]): Promise<void> {
    let doUpdate = false;

    // Reference to User
    const userRef = this.db.collection(USERS_COLLECTION).doc(userId);
    const user = await this.getUser(userId);

    if (!user) {
      console.log('[WARNING] [saveUserXpData] User not found ' + userId);
      return;
    }

    // Reference to Users' Character
    let userCharacterRef: FirebaseFirestore.DocumentReference;

    // Rererence to Users' XP collection (history)
    let userXpCollectionRef: FirebaseFirestore.DocumentReference;

    const batch = this.db.batch();
    if (totalXp > 0) {
      const incrementXpValue = admin.firestore.FieldValue.increment(totalXp);
      batch.set(userRef, { totalXp: incrementXpValue }, { merge: true });

      if (user.character) {
        userCharacterRef = userRef.collection(CHARACTER_SUB_COLLECTION).doc(user.character.id);
        batch.set(userCharacterRef, { xp: incrementXpValue }, { merge: true });
      }

      for (const userXpItem of userXpItems) {
        userXpCollectionRef = userRef.collection(XP_SUB_COLLECTION).doc();
        batch.set(userXpCollectionRef, serialize(userXpItem));
      }
      doUpdate = true;
    }

    if (doUpdate) {
      await batch.commit();
    }
  }
}
