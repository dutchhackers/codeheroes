import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, switchMap, tap } from 'rxjs';
import { UnmatchedEvent, UnmatchedEventCategory, UnmatchedEventResolutionAction, UnmatchedEventStatus } from '@codeheroes/types';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UnmatchedEventsService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  /** Shared signal for total pending unmatched events (used by shell badge) */
  readonly pendingCount = signal(0);

  getEvents(params?: {
    category?: UnmatchedEventCategory;
    status?: UnmatchedEventStatus;
  }): Observable<UnmatchedEvent[]> {
    return this.#withAuth((headers) => {
      let httpParams = new HttpParams();
      if (params?.category) {
        httpParams = httpParams.set('category', params.category);
      }
      if (params?.status) {
        httpParams = httpParams.set('status', params.status);
      }
      return this.#http.get<UnmatchedEvent[]>(`${environment.apiUrl}/unmatched-events`, {
        headers,
        params: httpParams,
      });
    });
  }

  getSummary(): Observable<{ unknownUserCount: number; unlinkedRepoCount: number }> {
    return this.#withAuth((headers) =>
      this.#http.get<{ unknownUserCount: number; unlinkedRepoCount: number }>(
        `${environment.apiUrl}/unmatched-events/summary`,
        { headers },
      ),
    ).pipe(
      tap((summary) => this.pendingCount.set(summary.unknownUserCount + summary.unlinkedRepoCount)),
    );
  }

  resolve(
    id: string,
    data: { resolutionAction: UnmatchedEventResolutionAction; resolutionTargetId?: string },
  ): Observable<UnmatchedEvent> {
    return this.#withAuth((headers) =>
      this.#http.post<UnmatchedEvent>(`${environment.apiUrl}/unmatched-events/${id}/resolve`, data, {
        headers,
      }),
    );
  }

  dismiss(id: string): Observable<UnmatchedEvent> {
    return this.#withAuth((headers) =>
      this.#http.post<UnmatchedEvent>(
        `${environment.apiUrl}/unmatched-events/${id}/dismiss`,
        {},
        {
          headers,
        },
      ),
    );
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
