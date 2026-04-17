import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { SystemOptionsDto } from '@codeheroes/types';
import { Observable, catchError, from, of, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

const EMPTY_OPTIONS: SystemOptionsDto = { studios: [], disciplines: [] };

@Injectable({ providedIn: 'root' })
export class SystemOptionsService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(Auth);
  readonly #authUser$ = user(this.#auth);

  #cache$: Observable<SystemOptionsDto> | null = null;

  getOptions(): Observable<SystemOptionsDto> {
    if (!this.#cache$) {
      this.#cache$ = this.#fetch().pipe(
        catchError(() => of(EMPTY_OPTIONS)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.#cache$;
  }

  #fetch(): Observable<SystemOptionsDto> {
    return this.#authUser$.pipe(
      switchMap((authUser) => {
        if (!authUser) return of(EMPTY_OPTIONS);
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
