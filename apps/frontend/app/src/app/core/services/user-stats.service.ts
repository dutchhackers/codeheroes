import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  getDoc,
  limit as firestoreLimit,
  orderBy,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, of, switchMap, map, catchError, from, forkJoin } from 'rxjs';
import { Activity, UserDto, UserStats } from '@codeheroes/types';
import { UserBadge } from '../models/user-badge.model';

export interface CurrentUserProfile {
  user: UserDto | null;
  stats: UserStats | null;
}

export interface WeeklyStatsRecord {
  weekId: string;
  data: Record<string, unknown> | undefined;
}

/** Milliseconds in one day (24 * 60 * 60 * 1000) */
const MS_PER_DAY = 86400000;

@Injectable({
  providedIn: 'root',
})
export class UserStatsService {
  readonly #firestore = inject(Firestore);
  readonly #auth = inject(Auth);
  readonly #injector = inject(Injector);

  // Initialize user observable in injection context to avoid warnings
  readonly #authUser$ = user(this.#auth);

  /**
   * Get the current authenticated user's Firestore user document
   */
  getCurrentUserDoc(): Observable<UserDto | null> {
    return this.#authUser$.pipe(
      switchMap((authUser) => {
        if (!authUser?.uid) {
          return of(null);
        }
        // Query users collection where uid matches the auth user's UID
        const usersRef = collection(this.#firestore, 'users');
        const usersQuery = query(usersRef, where('uid', '==', authUser.uid));
        // Use runInInjectionContext to avoid Firebase injection warnings
        return runInInjectionContext(this.#injector, () =>
          collectionData(usersQuery, { idField: 'id' }),
        ).pipe(
          map((users) => {
            const matchingUser = (users as UserDto[])[0];
            return matchingUser ?? null;
          }),
          catchError((error) => {
            console.error('Error fetching user doc:', error);
            return of(null);
          }),
        );
      }),
    );
  }

  /**
   * Get a specific user by ID
   */
  getUserById(userId: string): Observable<UserDto | null> {
    const userDocRef = doc(this.#firestore, `users/${userId}`);
    return runInInjectionContext(this.#injector, () => docData(userDocRef, { idField: 'id' })).pipe(
      map((data) => (data as UserDto) ?? null),
      catchError((error) => {
        console.error('Error fetching user by ID:', error);
        return of(null);
      }),
    );
  }

  /**
   * Get user stats from the subcollection users/{userId}/stats/current
   */
  getUserStats(userId: string): Observable<UserStats | null> {
    const statsDocRef = doc(this.#firestore, `users/${userId}/stats/current`);
    return runInInjectionContext(this.#injector, () => docData(statsDocRef)).pipe(
      map((data) => this.#transformStats(data)),
      catchError((error) => {
        console.error('Error fetching user stats:', error);
        return of(null);
      }),
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
    const activitiesQuery = query(activitiesRef, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
    return runInInjectionContext(this.#injector, () =>
      collectionData(activitiesQuery, { idField: 'id' }),
    ).pipe(
      map((activities) => activities as Activity[]),
      catchError((error) => {
        console.error('Error fetching user activities:', error);
        return of([]);
      }),
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
        return this.getUserStats(userDoc.id).pipe(map((stats) => ({ user: userDoc, stats })));
      }),
    );
  }

  /**
   * Get any user's profile with stats by user ID
   */
  getAnyUserProfile(userId: string): Observable<CurrentUserProfile> {
    return this.getUserById(userId).pipe(
      switchMap((userDoc) => {
        if (!userDoc) {
          return of({ user: null, stats: null });
        }
        return this.getUserStats(userId).pipe(map((stats) => ({ user: userDoc, stats })));
      }),
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
      }),
    );
  }

  /**
   * Update the current user's display name
   */
  async updateDisplayName(userId: string, newName: string): Promise<void> {
    const trimmed = newName.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 50) {
      throw new Error('Display name must be 2-50 characters');
    }

    const userDocRef = doc(this.#firestore, `users/${userId}`);
    await updateDoc(userDocRef, {
      displayName: trimmed,
      displayNameLower: trimmed.toLowerCase(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get badges for a specific user from users/{userId}/badges subcollection
   */
  getUserBadges(userId: string): Observable<UserBadge[]> {
    const badgesRef = collection(this.#firestore, `users/${userId}/badges`);
    // Note: removed orderBy to avoid potential index issues; badges sorted client-side
    return runInInjectionContext(this.#injector, () =>
      collectionData(badgesRef, { idField: 'id' }),
    ).pipe(
      map((badges) => {
        const typedBadges = badges as UserBadge[];
        // Sort a copy to avoid mutating the original array (important for RxJS stream immutability)
        return [...typedBadges].sort((a, b) => {
          const dateA = a.earnedAt ? new Date(a.earnedAt).getTime() : 0;
          const dateB = b.earnedAt ? new Date(b.earnedAt).getTime() : 0;
          return dateB - dateA;
        });
      }),
      catchError((error) => {
        console.error('Error fetching user badges:', error);
        return of([]);
      }),
    );
  }

  /**
   * Get the current user's badges
   */
  getCurrentUserBadges(): Observable<UserBadge[]> {
    return this.getCurrentUserDoc().pipe(
      switchMap((userDoc) => {
        if (!userDoc) {
          return of([]);
        }
        return this.getUserBadges(userDoc.id);
      }),
    );
  }

  /**
   * Get weekly stats history for a user
   * Fetches the last N weeks of activity stats
   */
  getWeeklyStatsHistory(userId: string, weekCount = 4): Observable<WeeklyStatsRecord[]> {
    const weekIds = this.#getLastNWeekIds(Math.max(1, weekCount));

    // Guard against empty array (forkJoin fails with empty array)
    if (weekIds.length === 0) {
      return of([]);
    }

    // Create observables for each week's document
    const weekObservables = weekIds.map((weekId) => {
      const weekDocRef = doc(this.#firestore, `users/${userId}/activityStats/weekly/records/${weekId}`);
      return from(getDoc(weekDocRef)).pipe(
        map((snapshot) => ({
          weekId,
          data: snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : undefined,
        })),
        catchError(() => of({ weekId, data: undefined })),
      );
    });

    return forkJoin(weekObservables);
  }

  /**
   * Get the current user's weekly stats history
   */
  getCurrentUserWeeklyHistory(weekCount = 4): Observable<WeeklyStatsRecord[]> {
    return this.getCurrentUserDoc().pipe(
      switchMap((userDoc) => {
        if (!userDoc) {
          return of([]);
        }
        return this.getWeeklyStatsHistory(userDoc.id, weekCount);
      }),
    );
  }

  /**
   * Calculate ISO week ID for a given date
   * Returns format: YYYY-WXX (e.g., "2026-W05")
   */
  #getWeekIdForDate(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // Set to Thursday of the current week (ISO week starts Monday)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7);
    return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Get the last N week IDs including the current week
   */
  #getLastNWeekIds(count: number): string[] {
    const weekIds: string[] = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i * 7);
      weekIds.push(this.#getWeekIdForDate(date));
    }

    return weekIds;
  }
}
