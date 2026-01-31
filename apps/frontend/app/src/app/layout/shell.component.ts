import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, Unsubscribe } from '@angular/fire/auth';
import { BottomNavComponent } from './bottom-nav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <div class="min-h-screen cyber-grid-bg text-white relative">
      @if (!isAuthenticated() && !isLoading()) {
        <!-- Login screen -->
        <div class="flex flex-col items-center justify-center min-h-screen px-6">
          <div
            class="flex flex-col items-center bg-black/60 backdrop-blur-sm rounded-2xl px-10 py-12 border border-white/10"
          >
            <img
              src="app-icons/icon-128x128.png"
              alt="Code Heroes logo"
              class="w-20 h-20 md:w-24 md:h-24 mb-6 invert"
            />
            <h1 class="text-3xl md:text-5xl font-bold italic text-white mb-4">Code Heroes</h1>
            <p class="text-base md:text-xl text-purple-400 mb-8 font-mono text-center max-w-xs">
              Level up your code game
            </p>
            <button
              type="button"
              (click)="signInWithGoogle()"
              aria-label="Sign in with Google"
              class="flex items-center gap-3 px-5 py-2.5 bg-white/10 text-white rounded border border-white/30 font-mono hover:bg-white/20 transition-colors"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" role="img" aria-label="Google logo">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      } @else if (isLoading()) {
        <!-- Loading state -->
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-xl md:text-2xl text-purple-400/70 animate-pulse font-mono" role="status" aria-live="polite">
            Loading...
          </div>
        </div>
      } @else {
        <!-- Authenticated content -->
        <router-outlet />
        <app-bottom-nav />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly #auth = inject(Auth);

  #authUnsubscribe: Unsubscribe | null = null;

  isAuthenticated = signal(false);
  isLoading = signal(true);

  ngOnInit() {
    this.#authUnsubscribe = onAuthStateChanged(this.#auth, (user) => {
      this.isAuthenticated.set(!!user);
      this.isLoading.set(false);
    });
  }

  ngOnDestroy() {
    if (this.#authUnsubscribe) {
      this.#authUnsubscribe();
    }
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(this.#auth, provider);
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  }
}
