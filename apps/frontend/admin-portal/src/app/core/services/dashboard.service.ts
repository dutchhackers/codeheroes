import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

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
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  getWeeklyLeaderboard(params?: { includeZeroXp?: boolean; userType?: string }): Observable<LeaderboardEntry[]> {
    return this.#withAuth((headers) => {
      let httpParams = new HttpParams();
      // Default includeZeroXp to true for backwards compatibility
      httpParams = httpParams.set('includeZeroXp', params?.includeZeroXp !== undefined ? String(params.includeZeroXp) : 'true');
      if (params?.userType) {
        httpParams = httpParams.set('userType', params.userType);
      }
      return this.#http.get<LeaderboardEntry[]>(
        `${environment.apiUrl}/leaderboards/week`,
        { headers, params: httpParams },
      );
    });
  }

  #withAuth<T>(fn: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    return from(this.#auth.getIdToken()).pipe(
      switchMap((token) => {
        if (!token) throw new Error('Not authenticated');
        return fn(new HttpHeaders().set('Authorization', `Bearer ${token}`));
      }),
    );
  }
}
