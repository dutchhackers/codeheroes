import { inject, Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, catchError, of } from 'rxjs';
import { ProjectSummaryDto } from '@codeheroes/types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectSearchService {
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

  searchProjects(term: string): Observable<ProjectSummaryDto[]> {
    if (!term || term.trim().length === 0) {
      return of([]);
    }
    return this.#withAuth((headers) =>
      this.#http.get<ProjectSummaryDto[]>(`${environment.apiUrl}/projects/search`, {
        headers,
        params: { q: term.trim() },
      }),
    ).pipe(
      catchError((error) => {
        console.error('Error searching projects:', error);
        return of([]);
      }),
    );
  }
}
