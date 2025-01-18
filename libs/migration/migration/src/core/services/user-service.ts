import * as admin from 'firebase-admin';

import { IUser } from '../models';
import { CoreService } from './abstract-service';
import { isNullOrUndefined } from 'util';

const USERS_COLLECTION = 'users';

export interface IUserService {
  getUser(userId: any): Promise<IUser>;
  getUsers(): Promise<IUser[]>;
  getUserByGitHubHandle(username: string): Promise<IUser>;
}

export class UserService extends CoreService implements IUserService {
  constructor() {
    super();
  }

  static getUserRef(db: any, docId): admin.firestore.DocumentReference {
    return db.collection(USERS_COLLECTION).doc(docId);
  }

  async getUser(userId: any): Promise<IUser> {
    if (!userId) {
      return null;
    }

    const doc = await this.db.collection(USERS_COLLECTION).doc(userId).get();
    if (doc !== null) {
      return <IUser>doc.data();
    }
    return null;
  }

  async getUsers(): Promise<IUser[]> {
    // return this.db.collection(ACCOUNTS_COLLECTION).get().then(async (gitUsers) => {
    //   const snapshot: User[] = [];
    //   if (gitUsers !== null) {
    //     const promises = gitUsers.docs.map(async gitUser => {
    //       const user = await this.getUser(gitUser.data().userRef);
    //       snapshot.push(user);
    //     })
    //     await Promise.all(promises);
    //     return snapshot;
    //   } else {
    //     return null;
    //   }
    // })
    return this.db
      .collection(USERS_COLLECTION)
      .get()
      .then(async (users) => {
        const snapshot: IUser[] = [];
        if (users !== null) {
          const promises = users.docs.map(async (individualUser) => {
            const user = await this.getUser(individualUser.id);
            snapshot.push(user);
          });
          await Promise.all(promises);
          return snapshot;
        } else {
          return null;
        }
      });
  }

  async getUserByGitHubHandle(username: string): Promise<IUser> {
    if (isNullOrUndefined(username)) {
      return null;
    }
    const query = this.db.collection(USERS_COLLECTION).where('githubAccount', '==', username);

    const snapshot = await query.limit(1).get();
    if (snapshot.size === 0) {
      return null;
    }
    return <IUser>snapshot.docs[0].data();
  }
}
