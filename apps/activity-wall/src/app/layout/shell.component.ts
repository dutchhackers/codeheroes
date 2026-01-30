import { Component, inject, signal, OnInit, OnDestroy, HostListener, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
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
        <div class="flex flex-col items-center justify-center min-h-screen">
          <h1 class="text-3xl md:text-5xl font-bold italic text-white mb-8">
            Code Heroes
          </h1>
          <p class="text-lg md:text-2xl text-slate-500 mb-6 md:mb-8 font-mono text-center">Authentication Required</p>
          <button
            type="button"
            (click)="signInWithGoogle()"
            aria-label="Sign in with Google"
            class="flex items-center gap-3 px-5 py-2.5 bg-white/10 text-white rounded border border-white/30 font-mono hover:bg-white/20 transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" role="img" aria-label="Google logo">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      } @else if (isLoading()) {
        <!-- Loading state -->
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-xl md:text-2xl text-purple-400/70 animate-pulse font-mono" role="status" aria-live="polite">Loading...</div>
        </div>
      } @else {
        <!-- Authenticated content -->
        <router-outlet />
        <app-bottom-nav />
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly #auth = inject(Auth);
  readonly #router = inject(Router);
  readonly #platformId = inject(PLATFORM_ID);

  #authUnsubscribe: Unsubscribe | null = null;
  #touchStartX = 0;
  #touchStartY = 0;
  #isTouchDevice = false;

  isAuthenticated = signal(false);
  isLoading = signal(true);

  readonly #routes = ['/hq', '/activity', '/profile'];
  readonly #swipeThreshold = 50;
  readonly #verticalThreshold = 100; // Ignore swipes that are more vertical than horizontal

  ngOnInit() {
    this.#authUnsubscribe = onAuthStateChanged(this.#auth, (user) => {
      this.isAuthenticated.set(!!user);
      this.isLoading.set(false);
    });

    // Detect touch device
    if (isPlatformBrowser(this.#platformId)) {
      this.#isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (!this.#isTouchDevice || !this.isAuthenticated()) return;
    this.#touchStartX = event.touches[0].clientX;
    this.#touchStartY = event.touches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    if (!this.#isTouchDevice || !this.isAuthenticated()) return;

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const deltaX = touchEndX - this.#touchStartX;
    const deltaY = Math.abs(touchEndY - this.#touchStartY);

    // Ignore if vertical movement is greater than horizontal (likely scrolling)
    if (deltaY > this.#verticalThreshold) return;

    // Swipe left (negative deltaX) -> go to profile
    if (deltaX < -this.#swipeThreshold) {
      this.#navigateToNextRoute();
    }
    // Swipe right (positive deltaX) -> go to activity
    else if (deltaX > this.#swipeThreshold) {
      this.#navigateToPreviousRoute();
    }
  }

  #getCurrentRoutePath(): string {
    // Strip query params and fragments to get just the path
    return this.#router.url.split('?')[0].split('#')[0];
  }

  #navigateToNextRoute() {
    const currentIndex = this.#routes.indexOf(this.#getCurrentRoutePath());
    const nextIndex = Math.min(currentIndex + 1, this.#routes.length - 1);
    if (nextIndex !== currentIndex && currentIndex >= 0) {
      this.#router.navigate([this.#routes[nextIndex]]);
    }
  }

  #navigateToPreviousRoute() {
    const currentIndex = this.#routes.indexOf(this.#getCurrentRoutePath());
    const prevIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex !== currentIndex && currentIndex >= 0) {
      this.#router.navigate([this.#routes[prevIndex]]);
    }
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
