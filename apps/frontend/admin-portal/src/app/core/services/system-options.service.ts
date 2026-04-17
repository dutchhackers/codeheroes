import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SystemOptionsDto } from '@codeheroes/types';
import { Observable, catchError, from, of, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

const EMPTY_OPTIONS: SystemOptionsDto = { studios: [], disciplines: [] };

@Injectable({ providedIn: 'root' })
export class SystemOptionsService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  #cache$: Observable<SystemOptionsDto> | null = null;

  getOptions(): Observable<SystemOptionsDto> {
    if (!this.#cache$) {
      this.#cache$ = from(this.#auth.getIdToken()).pipe(
        switchMap((token) => {
          if (!token) throw new Error('Not authenticated');
          const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
          return this.#http.get<SystemOptionsDto>(`${environment.apiUrl}/system/options`, { headers });
        }),
        catchError(() => of(EMPTY_OPTIONS)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.#cache$;
  }
}
