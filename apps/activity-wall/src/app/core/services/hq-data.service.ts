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
import { Observable, of, switchMap, map, catchError, combineLatest } from 'rxjs';
import { Activity, TimeBasedActivityStats, UserDto } from '@codeheroes/types';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface DailyProgress {
  xpEarned: number;
  goal: number;
  activitiesCount: number;
  lastActivity?: {
    type: string;
    timestamp: string;
  };
}

export interface WeeklyStats {
  xpGained: number;
  prsCreated: number;
  prsMerged: number;
  reviewsSubmitted: number;
  codePushes: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoUrl: string | null;
  xpGained: number;
  periodId: string;
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  rank?: number;
}

export interface Highlight {
  id: string;
  type: 'activity' | 'milestone' | 'achievement';
  icon: string;
  message: string;
  xp?: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class HqDataService {
  readonly #firestore = inject(Firestore);
  readonly #auth = inject(Auth);
  readonly #http = inject(HttpClient);

  readonly #DEFAULT_DAILY_GOAL = 600;

  /**
   * Get the current authenticated user's Firestore user document
   */
  #getCurrentUserDoc(): Observable<UserDto | null> {
    return user(this.#auth).pipe(
      switchMap((authUser) => {
        if (!authUser?.uid) {
          return of(null);
        }
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
   * Get current week ID in format YYYY-WXX
   */
  #getCurrentWeekId(): string {
    const date = new Date();
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Get current day ID in format YYYY-MM-DD
   */
  #getCurrentDayId(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Get today's daily progress for the current user
   */
  getDailyProgress(dailyGoal = this.#DEFAULT_DAILY_GOAL): Observable<DailyProgress> {
    return this.#getCurrentUserDoc().pipe(
      switchMap((userDoc) => {
        if (!userDoc) {
          return of({ xpEarned: 0, goal: dailyGoal, activitiesCount: 0 });
        }

        const dayId = this.#getCurrentDayId();
        const statsRef = doc(
          this.#firestore,
          `users/${userDoc.id}/activityStats/daily/records/${dayId}`
        );

        return docData(statsRef).pipe(
          map((data) => {
            const stats = data as TimeBasedActivityStats | undefined;
            const counters = stats?.counters?.actions ?? {};
            const activitiesCount = Object.values(counters).reduce((sum, val) => sum + (val ?? 0), 0);

            return {
              xpEarned: stats?.xpGained ?? 0,
              goal: dailyGoal,
              activitiesCount,
              lastActivity: stats?.lastActivity,
            };
          }),
          catchError(() => of({ xpEarned: 0, goal: dailyGoal, activitiesCount: 0 }))
        );
      })
    );
  }

  /**
   * Get this week's stats for the current user
   */
  getWeeklyStats(): Observable<WeeklyStats> {
    return this.#getCurrentUserDoc().pipe(
      switchMap((userDoc) => {
        if (!userDoc) {
          return of({
            xpGained: 0,
            prsCreated: 0,
            prsMerged: 0,
            reviewsSubmitted: 0,
            codePushes: 0,
          });
        }

        const weekId = this.#getCurrentWeekId();
        const statsRef = doc(
          this.#firestore,
          `users/${userDoc.id}/activityStats/weekly/records/${weekId}`
        );

        return docData(statsRef).pipe(
          map((data) => {
            const stats = data as TimeBasedActivityStats | undefined;
            const actions = stats?.counters?.actions ?? {};

            return {
              xpGained: stats?.xpGained ?? 0,
              prsCreated: actions['pull_request_create'] ?? 0,
              prsMerged: actions['pull_request_merge'] ?? 0,
              reviewsSubmitted: actions['code_review_submit'] ?? 0,
              codePushes: actions['code_push'] ?? 0,
            };
          }),
          catchError(() =>
            of({
              xpGained: 0,
              prsCreated: 0,
              prsMerged: 0,
              reviewsSubmitted: 0,
              codePushes: 0,
            })
          )
        );
      })
    );
  }

  /**
   * Get the weekly leaderboard with current user's rank
   */
  getWeeklyLeaderboard(limitCount = 10): Observable<{
    entries: LeaderboardEntry[];
    currentUserRank: number | null;
    currentUserId: string | null;
  }> {
    return combineLatest([
      this.#getCurrentUserDoc(),
      this.#http.get<LeaderboardEntry[]>(`${environment.apiUrl}/leaderboards/week`),
    ]).pipe(
      map(([userDoc, leaderboard]) => {
        // Add rank to each entry
        const rankedEntries = leaderboard.map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

        const currentUserId = userDoc?.id ?? null;
        const currentUserRank = currentUserId
          ? rankedEntries.findIndex((e) => e.userId === currentUserId) + 1 || null
          : null;

        return {
          entries: rankedEntries.slice(0, limitCount),
          currentUserRank,
          currentUserId,
        };
      }),
      catchError((error) => {
        console.error('Error fetching leaderboard:', error);
        return of({ entries: [], currentUserRank: null, currentUserId: null });
      })
    );
  }

  /**
   * Get recent highlights for the current user
   */
  getRecentHighlights(limitCount = 5): Observable<Highlight[]> {
    return this.#getCurrentUserDoc().pipe(
      switchMap((userDoc) => {
        if (!userDoc) {
          return of([]);
        }

        const activitiesRef = collection(this.#firestore, `users/${userDoc.id}/activities`);
        const activitiesQuery = query(
          activitiesRef,
          orderBy('createdAt', 'desc'),
          firestoreLimit(limitCount)
        );

        return collectionData(activitiesQuery, { idField: 'id' }).pipe(
          map((activities) => this.#transformActivitiesToHighlights(activities as Activity[])),
          catchError(() => of([]))
        );
      })
    );
  }

  #transformActivitiesToHighlights(activities: Activity[]): Highlight[] {
    return activities.map((activity) => ({
      id: activity.id,
      type: 'activity' as const,
      icon: this.#getIconForActionType(activity.sourceActionType),
      message: activity.userFacingDescription,
      xp: activity.xp?.earned,
      timestamp: activity.createdAt,
    }));
  }

  #getIconForActionType(actionType: string): string {
    const iconMap: Record<string, string> = {
      code_push: 'upload',
      pull_request_create: 'git-pull-request',
      pull_request_merge: 'git-merge',
      pull_request_close: 'x-circle',
      code_review_submit: 'eye',
      issue_open: 'alert-circle',
      issue_close: 'check-circle',
    };
    return iconMap[actionType] ?? 'activity';
  }
}
