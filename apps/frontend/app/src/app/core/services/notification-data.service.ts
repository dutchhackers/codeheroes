import { inject, Injectable, Injector, OnDestroy, runInInjectionContext } from '@angular/core';
import {
  collection,
  collectionData,
  doc,
  Firestore,
  limit as firestoreLimit,
  orderBy,
  query,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, of, switchMap, map, catchError, Subscription, BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { Notification, Collections } from '@codeheroes/types';

@Injectable({ providedIn: 'root' })
export class NotificationDataService implements OnDestroy {
  readonly #firestore = inject(Firestore);
  readonly #auth = inject(Auth);
  readonly #injector = inject(Injector);
  readonly #authUser$ = user(this.#auth);

  readonly #userId$ = this.#authUser$.pipe(
    map((u) => u?.uid ?? null),
    distinctUntilChanged(),
  );

  #userDocId: string | null = null;
  #userDocSub: Subscription | null = null;

  readonly notifications$: Observable<Notification[]> = this.#userId$.pipe(
    switchMap((uid) => {
      if (!uid) return of([]);
      // Query users collection to get Firestore doc ID from auth UID
      const usersRef = collection(this.#firestore, Collections.Users);
      const usersQuery = query(usersRef, where('uid', '==', uid));
      return runInInjectionContext(this.#injector, () =>
        collectionData(usersQuery, { idField: 'id' }),
      ).pipe(
        switchMap((users) => {
          const userDoc = (users as { id: string }[])[0];
          if (!userDoc) return of([]);
          this.#userDocId = userDoc.id;
          const notificationsRef = collection(
            this.#firestore,
            `${Collections.Users}/${userDoc.id}/${Collections.Notifications}`,
          );
          const notificationsQuery = query(
            notificationsRef,
            orderBy('createdAt', 'desc'),
            firestoreLimit(50),
          );
          return runInInjectionContext(this.#injector, () =>
            collectionData(notificationsQuery, { idField: 'id' }),
          ).pipe(map((docs) => docs as Notification[]));
        }),
      );
    }),
    catchError((error) => {
      console.error('Error fetching notifications:', error);
      return of([]);
    }),
  );

  readonly unreadCount$: Observable<number> = this.notifications$.pipe(
    map((notifications) => notifications.filter((n) => !n.read).length),
    distinctUntilChanged(),
  );

  ngOnDestroy() {
    this.#userDocSub?.unsubscribe();
  }

  async markAsRead(notificationIds: string[]): Promise<void> {
    if (!this.#userDocId || notificationIds.length === 0) return;
    const batch = writeBatch(this.#firestore);
    for (const id of notificationIds) {
      const ref = doc(
        this.#firestore,
        `${Collections.Users}/${this.#userDocId}/${Collections.Notifications}/${id}`,
      );
      batch.update(ref, { read: true, readAt: new Date().toISOString() });
    }
    await batch.commit();
  }

  async markAllAsRead(notifications: Notification[]): Promise<void> {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    await this.markAsRead(unreadIds);
  }
}
