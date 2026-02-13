import { inject, Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { ProjectSummaryDto, ProjectDetailDto, ProjectTimeBasedStats } from '@codeheroes/types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectDataService {
  readonly #auth = inject(Auth);
  readonly #http = inject(HttpClient);
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

  getProjects(): Observable<ProjectSummaryDto[]> {
    return this.#withAuth((headers) =>
      this.#http.get<ProjectSummaryDto[]>(`${environment.apiUrl}/projects`, { headers }),
    );
  }

  getProjectDetail(id: string): Observable<ProjectDetailDto> {
    return this.#withAuth((headers) =>
      this.#http.get<ProjectDetailDto>(`${environment.apiUrl}/projects/${id}`, { headers }),
    );
  }

  getProjectWeeklyStats(id: string, weekId?: string): Observable<ProjectTimeBasedStats> {
    const url = weekId
      ? `${environment.apiUrl}/projects/${id}/stats/weekly/${weekId}`
      : `${environment.apiUrl}/projects/${id}/stats/weekly`;
    return this.#withAuth((headers) => this.#http.get<ProjectTimeBasedStats>(url, { headers }));
  }

  getProjectDailyStats(id: string, dayId?: string): Observable<ProjectTimeBasedStats> {
    const url = dayId
      ? `${environment.apiUrl}/projects/${id}/stats/daily/${dayId}`
      : `${environment.apiUrl}/projects/${id}/stats/daily`;
    return this.#withAuth((headers) => this.#http.get<ProjectTimeBasedStats>(url, { headers }));
  }
}
