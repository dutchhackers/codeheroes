import { inject, Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { InstallationSummaryDto } from '@codeheroes/types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InstallationsService {
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

  getInstallations(): Observable<InstallationSummaryDto[]> {
    return this.#withAuth((headers) =>
      this.#http.get<InstallationSummaryDto[]>(`${environment.apiUrl}/installations`, { headers }),
    );
  }

  setupInstallation(installationId: number, setupAction: string): Observable<InstallationSummaryDto> {
    return this.#withAuth((headers) =>
      this.#http.post<InstallationSummaryDto>(
        `${environment.apiUrl}/installations/setup`,
        { installationId, setupAction },
        { headers },
      ),
    );
  }

  unlinkInstallation(id: string): Observable<void> {
    return this.#withAuth((headers) =>
      this.#http.delete<void>(`${environment.apiUrl}/installations/${id}`, { headers }),
    );
  }
}
