import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  Unsubscribe,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  readonly #auth = inject(Auth);
  readonly #unsubscribe: Unsubscribe;

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isLoading = signal(true);

  constructor() {
    this.#unsubscribe = onAuthStateChanged(this.#auth, (user) => {
      this.currentUser.set(user);
      this.isLoading.set(false);
    });
  }

  ngOnDestroy() {
    this.#unsubscribe();
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.#auth, provider);
  }

  async signOut(): Promise<void> {
    await signOut(this.#auth);
  }

  async getIdToken(): Promise<string | null> {
    const user = this.currentUser();
    if (!user) return null;
    return user.getIdToken();
  }
}
