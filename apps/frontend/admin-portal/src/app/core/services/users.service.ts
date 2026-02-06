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
    return from(this.#auth.getIdToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
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
      })
    );
  }

  getUser(id: string): Observable<UserDto> {
    return from(this.#auth.getIdToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.#http.get<UserDto>(`${environment.apiUrl}/users/${id}`, { headers });
      })
    );
  }
}
