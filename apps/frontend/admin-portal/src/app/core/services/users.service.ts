import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { ConnectedAccountDto, ConnectedAccountProvider, UserDto, PaginatedResponse } from '@codeheroes/types';
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

  getConnectedAccounts(userId: string): Observable<ConnectedAccountDto[]> {
    return this.#withAuth((headers) =>
      this.#http.get<ConnectedAccountDto[]>(`${environment.apiUrl}/users/${userId}/connected-accounts`, { headers }),
    );
  }

  addConnectedAccount(
    userId: string,
    data: { provider: ConnectedAccountProvider; externalUserId: string; externalUserName?: string },
  ): Observable<ConnectedAccountDto> {
    return this.#withAuth((headers) =>
      this.#http.post<ConnectedAccountDto>(`${environment.apiUrl}/users/${userId}/connected-accounts`, data, {
        headers,
      }),
    );
  }

  removeConnectedAccount(userId: string, accountId: string): Observable<void> {
    return this.#withAuth((headers) =>
      this.#http.delete<void>(`${environment.apiUrl}/users/${userId}/connected-accounts/${accountId}`, { headers }),
    );
  }

  updateUser(id: string, data: { name?: string; displayName?: string }): Observable<UserDto> {
    return this.#withAuth((headers) =>
      this.#http.patch<UserDto>(`${environment.apiUrl}/users/${id}`, data, { headers }),
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
