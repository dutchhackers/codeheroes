import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { collection, collectionData, Firestore, query, where } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, from, switchMap, map, catchError } from 'rxjs';
import { UserDto, UserSettings, UpdateUserSettingsDto, DEFAULT_DAILY_GOAL } from '@codeheroes/types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  readonly #firestore = inject(Firestore);
  readonly #auth = inject(Auth);
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);

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

  #getCurrentUserDoc(): Observable<UserDto | null> {
    return this.#authUser$.pipe(
      switchMap((authUser) => {
        if (!authUser?.uid) return of(null);
        const usersRef = collection(this.#firestore, 'users');
        const usersQuery = query(usersRef, where('uid', '==', authUser.uid));
        return runInInjectionContext(this.#injector, () =>
          collectionData(usersQuery, { idField: 'id' }),
        ).pipe(
          map((users) => (users as UserDto[])[0] ?? null),
          catchError(() => of(null)),
        );
      }),
    );
  }

  getSettings(userId: string): Observable<UserSettings> {
    return this.#withAuth((headers) =>
      this.#http.get<UserSettings>(`${environment.apiUrl}/users/${userId}/settings`, { headers }),
    );
  }

  updateSettings(userId: string, updates: UpdateUserSettingsDto): Observable<UserSettings> {
    return this.#withAuth((headers) =>
      this.#http.patch<UserSettings>(`${environment.apiUrl}/users/${userId}/settings`, updates, { headers }),
    );
  }

  getDailyGoal(): Observable<number> {
    return this.#getCurrentUserDoc().pipe(
      switchMap((userDoc) => {
        if (!userDoc) return of(DEFAULT_DAILY_GOAL);
        return this.getSettings(userDoc.id).pipe(
          map((settings) => settings.dailyGoal ?? DEFAULT_DAILY_GOAL),
          catchError(() => of(DEFAULT_DAILY_GOAL)),
        );
      }),
    );
  }
}
