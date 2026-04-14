import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { InstallationSummaryDto } from '@codeheroes/types';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InstallationsService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  getAllInstallations(): Observable<InstallationSummaryDto[]> {
    return this.#withAuth((headers) =>
      this.#http.get<InstallationSummaryDto[]>(`${environment.apiUrl}/installations/admin/all`, { headers }),
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
