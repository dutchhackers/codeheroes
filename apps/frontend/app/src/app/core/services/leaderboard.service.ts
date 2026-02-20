import { inject, Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, map, catchError, of, combineLatest } from 'rxjs';
import { Firestore, collection, collectionData, query, where, orderBy } from '@angular/fire/firestore';
import { Injector, runInInjectionContext } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface LeaderboardEntry {
  userId: string;
  name: string;
  displayName: string;
  photoUrl: string | null;
  xpGained: number;
  periodId: string;
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  userType: string;
  rank?: number;
}

export interface ProjectLeaderboardEntry {
  projectId: string;
  name: string;
  slug: string;
  xpGained: number;
  totalXp: number;
  activeMemberCount: number;
  activeRepoCount: number;
  periodId: string;
}

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  readonly #auth = inject(Auth);
  readonly #http = inject(HttpClient);
  readonly #firestore = inject(Firestore);
  readonly #injector = inject(Injector);
  readonly #authUser$ = user(this.#auth);

  #withAuth<T>(fn: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    return this.#authUser$.pipe(
      switchMap((authUser) => {
        if (!authUser) throw new Error('Not authenticated');
        return from(authUser.getIdToken()).pipe(
          switchMap((token) => fn(new HttpHeaders().set('Authorization', `Bearer ${token}`))),
        );
      }),
    );
  }

  #getCurrentUserDoc() {
    return this.#authUser$.pipe(
      switchMap((authUser) => {
        if (!authUser?.uid) return of(null);
        const usersRef = collection(this.#firestore, 'users');
        const usersQuery = query(usersRef, where('uid', '==', authUser.uid));
        return runInInjectionContext(this.#injector, () =>
          collectionData(usersQuery, { idField: 'id' }),
        ).pipe(
          map((users) => (users as { id: string }[])[0] ?? null),
          catchError(() => of(null)),
        );
      }),
    );
  }

  /**
   * Get user leaderboard for a period, optionally filtered by userType
   */
  getUserLeaderboard(
    period: 'week' | 'day',
    userType?: 'user' | 'bot',
    limitCount = 0,
  ): Observable<{
    entries: LeaderboardEntry[];
    currentUserRank: number | null;
    currentUserId: string | null;
  }> {
    const params: Record<string, string> = {};
    if (userType) params['userType'] = userType;

    return combineLatest([
      this.#getCurrentUserDoc(),
      this.#withAuth((headers) =>
        this.#http.get<LeaderboardEntry[]>(`${environment.apiUrl}/leaderboards/${period}`, {
          headers,
          params,
        }),
      ),
    ]).pipe(
      map(([userDoc, leaderboard]) => {
        const rankedEntries = leaderboard.map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

        const currentUserId = userDoc?.id ?? null;
        const currentUserRank = currentUserId
          ? rankedEntries.findIndex((e) => e.userId === currentUserId) + 1 || null
          : null;

        return {
          entries: limitCount > 0 ? rankedEntries.slice(0, limitCount) : rankedEntries,
          currentUserRank,
          currentUserId,
        };
      }),
      catchError((error) => {
        console.error(`Error fetching ${period} leaderboard:`, error);
        return of({ entries: [], currentUserRank: null, currentUserId: null });
      }),
    );
  }

  /**
   * Get project leaderboard for a period
   */
  getProjectLeaderboard(
    period: 'week' | 'day',
    limitCount = 0,
  ): Observable<ProjectLeaderboardEntry[]> {
    return this.#withAuth((headers) =>
      this.#http.get<ProjectLeaderboardEntry[]>(
        `${environment.apiUrl}/leaderboards/projects/${period}`,
        { headers },
      ),
    ).pipe(
      map((entries) => (limitCount > 0 ? entries.slice(0, limitCount) : entries)),
      catchError((error) => {
        console.error(`Error fetching ${period} project leaderboard:`, error);
        return of([]);
      }),
    );
  }
}
