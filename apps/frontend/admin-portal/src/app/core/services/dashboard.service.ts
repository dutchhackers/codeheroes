import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  getWeeklyLeaderboard(): Observable<LeaderboardEntry[]> {
    return from(this.#auth.getIdToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.#http.get<LeaderboardEntry[]>(
          `${environment.apiUrl}/leaderboards/week?includeZeroXp=true`,
          { headers },
        );
      }),
    );
  }
}
