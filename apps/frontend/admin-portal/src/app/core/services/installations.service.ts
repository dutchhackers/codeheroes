import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, shareReplay, switchMap, catchError, throwError } from 'rxjs';
import { InstallationSummaryDto } from '@codeheroes/types';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InstallationsService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  #cache$: Observable<InstallationSummaryDto[]> | null = null;

  getAllInstallations(): Observable<InstallationSummaryDto[]> {
    if (!this.#cache$) {
      this.#cache$ = this.#withAuth((headers) =>
        this.#http.get<InstallationSummaryDto[]>(`${environment.apiUrl}/installations/admin/all`, { headers }),
      ).pipe(
        catchError((err) => {
          this.#cache$ = null;
          return throwError(() => err);
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }
    return this.#cache$;
  }

  refreshInstallations(): void {
    this.#cache$ = null;
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
