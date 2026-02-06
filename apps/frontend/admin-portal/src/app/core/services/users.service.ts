import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface UserSummary {
  id: string;
  displayName?: string;
  email?: string;
  level?: number;
  xp?: number;
  totalActions?: number;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  getUsers(): Observable<UserSummary[]> {
    return from(this.#auth.getIdToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.#http.get<UserSummary[]>(`${environment.apiUrl}/users`, { headers });
      })
    );
  }

  getUser(id: string): Observable<UserSummary> {
    return from(this.#auth.getIdToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.#http.get<UserSummary>(`${environment.apiUrl}/users/${id}`, { headers });
      })
    );
  }
}
