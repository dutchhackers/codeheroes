import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  limit as firestoreLimit,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, of, switchMap, map, catchError } from 'rxjs';
import { Activity, UserDto, UserStats } from '@codeheroes/types';

export interface CurrentUserProfile {
  user: UserDto | null;
  stats: UserStats | null;
}

@Injectable({
  providedIn: 'root',
})
export class UserStatsService {
  readonly #firestore = inject(Firestore);
  readonly #auth = inject(Auth);

  /**
   * Get the current authenticated user's Firestore user document
   */
  getCurrentUserDoc(): Observable<UserDto | null> {
    return user(this.#auth).pipe(
      switchMap((authUser) => {
        if (!authUser?.uid) {
          return of(null);
        }
        // Query users collection where uid matches the auth user's UID
        const usersRef = collection(this.#firestore, 'users');
        const usersQuery = query(usersRef, where('uid', '==', authUser.uid));
        return collectionData(usersQuery, { idField: 'id' }).pipe(
          map((users) => {
            const matchingUser = (users as UserDto[])[0];
            return matchingUser ?? null;
          }),
          catchError((error) => {
            console.error('Error fetching user doc:', error);
            return of(null);
          })
        );
      })
    );
  }

  /**
   * Get user stats from the subcollection users/{userId}/stats/current
   */
  getUserStats(userId: string): Observable<UserStats | null> {
    const statsDocRef = doc(this.#firestore, `users/${userId}/stats/current`);
    return docData(statsDocRef).pipe(
      map((data) => this.#transformStats(data)),
      catchError((error) => {
        console.error('Error fetching user stats:', error);
        return of(null);
      })
    );
  }

  /**
   * Transform raw Firestore stats data to UserStats type
   * Maps flat counters.actions structure to nested counters structure
   */
  #transformStats(data: unknown): UserStats | null {
    if (!data) return null;

    const raw = data as Record<string, unknown>;
    const actions = (raw['counters'] as Record<string, unknown>)?.['actions'] as Record<string, number> | undefined;

    return {
      xp: (raw['xp'] as number) ?? 0,
      level: (raw['level'] as number) ?? 1,
      currentLevelXp: (raw['currentLevelXp'] as number) ?? 0,
      xpToNextLevel: (raw['xpToNextLevel'] as number) ?? 0,
      lastActivityDate: (raw['lastActivityDate'] as string) ?? null,
      counters: {
        pullRequests: {
          created: actions?.['pull_request_create'] ?? 0,
          merged: actions?.['pull_request_merge'] ?? 0,
          closed: actions?.['pull_request_close'] ?? 0,
          total: actions?.['pull_request_create'] ?? 0,
        },
        codePushes: actions?.['code_push'] ?? 0,
        codeReviews: actions?.['code_review_submit'] ?? 0,
      },
      countersLastUpdated: (raw['countersLastUpdated'] as string) ?? '',
      lastUpdated: (raw['updatedAt'] as string) ?? '',
    };
  }

  /**
   * Get recent activities for a specific user
   */
  getUserActivities(userId: string, limitCount = 10): Observable<Activity[]> {
    const activitiesRef = collection(this.#firestore, `users/${userId}/activities`);
    const activitiesQuery = query(
      activitiesRef,
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount)
    );
    return collectionData(activitiesQuery, { idField: 'id' }).pipe(
      map((activities) => activities as Activity[]),
      catchError((error) => {
        console.error('Error fetching user activities:', error);
        return of([]);
      })
    );
  }

  /**
   * Get the current user's profile with stats - combined observable
   */
  getCurrentUserProfile(): Observable<CurrentUserProfile> {
    return this.getCurrentUserDoc().pipe(
      switchMap((userDoc) => {
        if (!userDoc) {
          return of({ user: null, stats: null });
        }
        return this.getUserStats(userDoc.id).pipe(
          map((stats) => ({ user: userDoc, stats }))
        );
      })
    );
  }

  /**
   * Get the current user's activities
   */
  getCurrentUserActivities(limitCount = 10): Observable<Activity[]> {
    return this.getCurrentUserDoc().pipe(
      switchMap((userDoc) => {
        if (!userDoc) {
          return of([]);
        }
        return this.getUserActivities(userDoc.id, limitCount);
      })
    );
  }
}
