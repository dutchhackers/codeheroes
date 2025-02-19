import { inject, Injectable, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  collection,
  collectionData,
  Firestore,
  orderBy,
  query,
  where,
  limit,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import type { Observable } from 'rxjs';
import { map, of, tap } from 'rxjs';

import type { IActivity, IUser } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  readonly #authenticatedUser = inject(Auth).currentUser;
  readonly #firestore = inject(Firestore);
  readonly #path = 'users';

  readonly user = signal<IUser | null>(null);

  public getMe(): Observable<IUser | null> {
    if (!this.#authenticatedUser) {
      return of(null);
    }
    return this.getUser(this.#authenticatedUser.uid).pipe(tap((user) => this.user.set(user)));
  }

  public getUser(uid: string): Observable<IUser | null> {
    const queryResult = query(this.#collection(), where('uid', '==', uid)).withConverter({
      fromFirestore: (snap) => snap.data() as IUser,
      toFirestore: (data) => data,
    });

    return collectionData<IUser | null>(queryResult).pipe(map((users) => users[0] || null));
  }

  public getUserActivities(user: IUser, maxActivities = 100): Observable<IActivity[]> {
    const queryResult = query(
      this.#collection(`/users/${user.id}/activities`),
      where('processingResult.xp.awarded', '>', 0),
      limit(maxActivities),
      orderBy('createdAt', 'desc'),
    );

    return collectionData<IActivity>(
      queryResult.withConverter({
        fromFirestore: (snap) => snap.data() as IActivity,
        toFirestore: (data) => data,
      }),
    );
  }

  public async updateUser(docId: number, data: Partial<IUser>): Promise<void> {
    try {
      await updateDoc(doc(this.#firestore, `${this.#path}/${docId}`), data);
    } catch {
      throw new Error('Failed to update user data');
    }
  }

  readonly #collection = (path: string = this.#path) => collection(this.#firestore, path);
}
