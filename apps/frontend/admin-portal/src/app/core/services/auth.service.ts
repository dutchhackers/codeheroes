import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  Unsubscribe,
} from '@angular/fire/auth';
import { environment } from '../../../environments/environment';

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

    if (environment.useEmulators && environment.autoLogin) {
      this.#autoLogin(environment.autoLogin.email, environment.autoLogin.password);
    }
  }

  async #autoLogin(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.#auth, email, password);
    } catch {
      try {
        await createUserWithEmailAndPassword(this.#auth, email, password);
      } catch (createError) {
        console.error('Auto-login failed:', createError);
      }
    }
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
