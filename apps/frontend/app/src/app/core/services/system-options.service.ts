import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { SystemOptionsDto } from '@codeheroes/types';
import { Observable, ReplaySubject, defer, from, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SystemOptionsService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(Auth);
  readonly #authUser$ = user(this.#auth);

  #cache$: ReplaySubject<SystemOptionsDto> | null = null;

  getOptions(): Observable<SystemOptionsDto> {
    if (this.#cache$) {
      return this.#cache$.asObservable();
    }
    const subject = new ReplaySubject<SystemOptionsDto>(1);
    this.#cache$ = subject;

    return defer(() => this.#fetch()).pipe(
      tap({
        next: (value) => subject.next(value),
        error: () => {
          this.#cache$ = null;
          subject.next({ studios: [], disciplines: [] });
          subject.complete();
        },
      }),
      switchMap(() => subject.asObservable()),
    );
  }

  #fetch(): Observable<SystemOptionsDto> {
    return this.#authUser$.pipe(
      switchMap((authUser) => {
        if (!authUser) return of({ studios: [], disciplines: [] });
        return from(authUser.getIdToken()).pipe(
          switchMap((token) => {
            const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
            return this.#http.get<SystemOptionsDto>(`${environment.apiUrl}/system/options`, { headers });
          }),
        );
      }),
    );
  }
}
