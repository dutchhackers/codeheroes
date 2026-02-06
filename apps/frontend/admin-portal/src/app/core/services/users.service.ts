import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { UserDto, PaginatedResponse } from '@codeheroes/types';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  getUsers(params?: { limit?: number; startAfterId?: string }): Observable<PaginatedResponse<UserDto>> {
    return this.#withAuth((headers) => {
      let httpParams = new HttpParams();
      if (params?.limit) {
        httpParams = httpParams.set('limit', params.limit);
      }
      if (params?.startAfterId) {
        httpParams = httpParams.set('startAfterId', params.startAfterId);
      }
      return this.#http.get<PaginatedResponse<UserDto>>(`${environment.apiUrl}/users`, {
        headers,
        params: httpParams,
      });
    });
  }

  getUser(id: string): Observable<UserDto> {
    return this.#withAuth((headers) =>
      this.#http.get<UserDto>(`${environment.apiUrl}/users/${id}`, { headers }),
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
