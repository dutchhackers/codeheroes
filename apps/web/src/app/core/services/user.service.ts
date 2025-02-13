import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { collection, collectionData, Firestore, orderBy, query, where } from '@angular/fire/firestore';
import type { Observable } from 'rxjs';
import { map, of } from 'rxjs';
import type { IActivity, IUser } from '../interfaces';
import { limitToLast } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  readonly #authenticatedUser = inject(Auth).currentUser;
  readonly #firestore = inject(Firestore);
  readonly #path = 'users';

  public getMe(): Observable<IUser | null> {
    if (!this.#authenticatedUser) {
      return of(null);
    }
    return this.getUser(this.#authenticatedUser.uid);
  }

  public getUser(uid: string): Observable<IUser | null> {
    const queryResult = query(this.#collection(), where('uid', '==', uid)).withConverter({
      fromFirestore: (snap) => snap.data() as IUser,
      toFirestore: (data) => data,
    });

    return collectionData<IUser | null>(queryResult).pipe(map((users) => users[0] || null));
  }

  public getUserActivities(user: IUser, limit = 100): Observable<IActivity[]> {
    const queryResult = query(
      this.#collection(`/users/${user.id}/activities`),
      limitToLast(limit),
      orderBy('createdAt', 'desc'),
    );
    return collectionData<IActivity>(
      queryResult.withConverter({
        fromFirestore: (snap) => snap.data() as IActivity,
        toFirestore: (data) => data,
      }),
    );
  }

  readonly #collection = (path: string = this.#path) => collection(this.#firestore, path);
}
