import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { collection, Firestore, query } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  // readonly #authenticatedUser = inject(Auth).currentUser;
  // readonly #firestore = inject(Firestore);
  // readonly #path = 'events';
  // readonly #collection = collection(this.#firestore, this.#path);
  // public getEventsByUser(uid: string) {
  //   const queryResult = query(this.#collection, where('uid', '==', uid)).withConverter({
  //     fromFirestore: (snap) => snap.data() as IUser,
  //     toFirestore: (data) => data,
  //   });
  //   return collectionData<IUser | null>(queryResult).pipe(map((users) => users[0] || null));
  // }
}
