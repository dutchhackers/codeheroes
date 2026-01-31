import { inject, Injectable, signal, computed } from '@angular/core';
import { collection, Firestore, getDocs } from '@angular/fire/firestore';
import { UserDto } from '@codeheroes/types';

export interface UserInfo {
  id: string;
  displayName: string;
  photoUrl: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class UserCacheService {
  readonly #firestore = inject(Firestore);
  readonly #usersMap = signal<Map<string, UserInfo>>(new Map());
  readonly #loaded = signal(false);

  readonly loaded = this.#loaded.asReadonly();
  readonly userCount = computed(() => this.#usersMap().size);

  async loadUsers(): Promise<void> {
    if (this.#loaded()) {
      return;
    }

    const usersRef = collection(this.#firestore, 'users');
    const snapshot = await getDocs(usersRef);

    const usersMap = new Map<string, UserInfo>();
    snapshot.forEach((doc) => {
      const data = doc.data() as UserDto;
      usersMap.set(doc.id, {
        id: doc.id,
        displayName: data.displayName,
        photoUrl: data.photoUrl,
      });
    });

    this.#usersMap.set(usersMap);
    this.#loaded.set(true);
  }

  getUserInfo(userId: string): UserInfo | null {
    return this.#usersMap().get(userId) ?? null;
  }

  /**
   * Update a single user's info in the cache
   */
  updateUserInCache(userId: string, updates: Partial<UserInfo>): void {
    const current = this.#usersMap().get(userId);
    if (current) {
      const updated = new Map(this.#usersMap());
      updated.set(userId, { ...current, ...updates });
      this.#usersMap.set(updated);
    }
  }
}
