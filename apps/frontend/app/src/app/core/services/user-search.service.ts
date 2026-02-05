import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  collection,
  collectionData,
  Firestore,
  limit as firestoreLimit,
  orderBy,
  query,
  where,
  startAt,
  endAt,
} from '@angular/fire/firestore';
import { Observable, of, catchError } from 'rxjs';
import { UserDto } from '@codeheroes/types';

@Injectable({
  providedIn: 'root',
})
export class UserSearchService {
  readonly #firestore = inject(Firestore);
  readonly #injector = inject(Injector);

  /**
   * Search for users by display name (case-insensitive prefix search)
   */
  searchUsers(searchTerm: string, limitCount = 20): Observable<UserDto[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return of([]);
    }

    const trimmed = searchTerm.trim();
    const usersRef = collection(this.#firestore, 'users');
    
    // Create a query that searches for users whose displayName starts with the search term
    // Firebase requires the field to be indexed for this to work efficiently
    const searchQuery = query(
      usersRef,
      where('active', '==', true),
      orderBy('displayName'),
      startAt(trimmed),
      endAt(trimmed + '\uf8ff'),
      firestoreLimit(limitCount)
    );

    return runInInjectionContext(this.#injector, () =>
      collectionData(searchQuery, { idField: 'id' })
    ).pipe(
      catchError((error) => {
        console.error('Error searching users:', error);
        return of([]);
      })
    ) as Observable<UserDto[]>;
  }

  /**
   * Get all active users (for browsing)
   */
  getAllUsers(limitCount = 50): Observable<UserDto[]> {
    const usersRef = collection(this.#firestore, 'users');
    const usersQuery = query(
      usersRef,
      where('active', '==', true),
      orderBy('displayName'),
      firestoreLimit(limitCount)
    );

    return runInInjectionContext(this.#injector, () =>
      collectionData(usersQuery, { idField: 'id' })
    ).pipe(
      catchError((error) => {
        console.error('Error fetching users:', error);
        return of([]);
      })
    ) as Observable<UserDto[]>;
  }
}
