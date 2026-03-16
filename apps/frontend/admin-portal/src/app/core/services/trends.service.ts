import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { TrendsResponse } from '@codeheroes/types';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TrendsService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  getTrends(weeks = 10): Observable<TrendsResponse> {
    return this.#withAuth((headers) => {
      const params = new HttpParams().set('weeks', String(weeks));
      return this.#http.get<TrendsResponse>(`${environment.apiUrl}/trends/weekly`, { headers, params });
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
