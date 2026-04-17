import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SystemOptionsDto } from '@codeheroes/types';
import { Observable, ReplaySubject, from, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SystemOptionsService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  #cache$: ReplaySubject<SystemOptionsDto> | null = null;

  getOptions(): Observable<SystemOptionsDto> {
    if (this.#cache$) {
      return this.#cache$.asObservable();
    }
    const subject = new ReplaySubject<SystemOptionsDto>(1);
    this.#cache$ = subject;

    return from(this.#auth.getIdToken()).pipe(
      switchMap((token) => {
        if (!token) throw new Error('Not authenticated');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.#http.get<SystemOptionsDto>(`${environment.apiUrl}/system/options`, { headers });
      }),
      tap({
        next: (value) => subject.next(value),
        error: () => {
          this.#cache$ = null;
          subject.next({ studios: [], disciplines: [] });
          subject.complete();
        },
      }),
    );
  }
}
