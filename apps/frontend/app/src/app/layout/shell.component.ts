import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import {
  Auth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  Unsubscribe,
} from '@angular/fire/auth';
import { Subscription, filter, pairwise, map } from 'rxjs';
import { NotificationType } from '@codeheroes/types';
import { BottomNavComponent } from './bottom-nav.component';
import { EnvironmentBannerComponent, showEnvironmentIndicator } from './environment-banner.component';
import { LevelUpCelebrationComponent } from '../shared/components/level-up-celebration.component';
import { NotificationDataService } from '../core/services/notification-data.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, EnvironmentBannerComponent, LevelUpCelebrationComponent],
  template: `
    <app-environment-banner />
    <div class="min-h-screen cyber-grid-bg text-white relative" [class.pt-6]="showBanner">
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
        <!-- Notification bell -->
        <button type="button" class="bell-button" (click)="openNotifications()" aria-label="Notifications">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          @if (unreadCount() > 0) {
            <span class="badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
          }
        </button>

        <!-- Authenticated content -->
        <router-outlet />
        <app-bottom-nav />

        <!-- Level-up celebration overlay -->
        @if (showLevelUp()) {
          <app-level-up-celebration [level]="levelUpLevel()" (dismissed)="dismissLevelUp()" />
        }
      }

      <!-- Update available banner -->
      @if (updateAvailable()) {
        <div class="update-banner" role="alert">
          <span>A new version is available</span>
          <button type="button" (click)="applyUpdate()">Update now</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .update-banner {
        position: fixed;
        bottom: calc(5rem + env(safe-area-inset-bottom));
        left: 1rem;
        right: 1rem;
        z-index: 110; /* Above modals (z-index: 100) */
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.875rem 1.25rem;
        background: rgba(0, 245, 255, 0.1);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(0, 245, 255, 0.3);
        border-radius: 12px;
        color: white;
        font-size: 0.875rem;
        box-shadow: 0 0 16px rgba(0, 245, 255, 0.15);
      }

      .update-banner button {
        flex-shrink: 0;
        padding: 0.375rem 1rem;
        background: var(--neon-cyan, #00f5ff);
        color: black;
        font-weight: 600;
        font-size: 0.8125rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: opacity 0.2s;
        min-height: 2.75rem;
      }

      .update-banner button:hover {
        opacity: 0.85;
      }

      .bell-button {
        position: fixed;
        top: 0.875rem;
        right: 1rem;
        z-index: 60;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        transition: all 0.2s;
      }

      .bell-button:hover {
        color: white;
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(0, 0, 0, 0.8);
      }

      .badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 9px;
        background: rgb(239, 68, 68);
        color: white;
        font-size: 0.6875rem;
        font-weight: 700;
        line-height: 18px;
        text-align: center;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
      }
    `,
  ],
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly #auth = inject(Auth);
  readonly #swUpdate = inject(SwUpdate);
  readonly #router = inject(Router);
  readonly #notificationService = inject(NotificationDataService);
  readonly showBanner = showEnvironmentIndicator;

  #authUnsubscribe: Unsubscribe | null = null;
  #updateSubscription: Subscription | null = null;
  #notificationSub: Subscription | null = null;
  #levelUpTimeout: ReturnType<typeof setTimeout> | null = null;

  isAuthenticated = signal(false);
  isLoading = signal(true);
  updateAvailable = signal(false);
  unreadCount = signal(0);
  showLevelUp = signal(false);
  levelUpLevel = signal(0);

  ngOnInit() {
    let autoLoginAttempted = false;

    this.#authUnsubscribe = onAuthStateChanged(this.#auth, (user) => {
      this.isAuthenticated.set(!!user);
      this.isLoading.set(false);

      if (!user && !autoLoginAttempted && environment.useEmulators && environment.autoLogin) {
        autoLoginAttempted = true;
        this.#autoLogin(environment.autoLogin.email, environment.autoLogin.password);
      }
    });

    if (this.#swUpdate.isEnabled) {
      this.#updateSubscription = this.#swUpdate.versionUpdates
        .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
        .subscribe(() => this.updateAvailable.set(true));
    }

    // Subscribe to unread count
    this.#notificationSub = this.#notificationService.unreadCount$.subscribe((count) =>
      this.unreadCount.set(count),
    );

    // Detect new LEVEL_UP notifications for celebration overlay
    this.#notificationService.notifications$
      .pipe(
        pairwise(),
        map(([prev, curr]) => {
          // Find notifications in curr that weren't in prev (new arrivals)
          const prevIds = new Set(prev.map((n) => n.id));
          return curr.filter((n) => !prevIds.has(n.id) && n.type === NotificationType.LEVEL_UP);
        }),
        filter((newLevelUps) => newLevelUps.length > 0),
      )
      .subscribe((newLevelUps) => {
        const level = (newLevelUps[0].metadata?.['newLevel'] as number) ?? 0;
        if (level > 0) {
          this.levelUpLevel.set(level);
          this.showLevelUp.set(true);
          this.#levelUpTimeout = setTimeout(() => this.showLevelUp.set(false), 5000);
        }
      });
  }

  ngOnDestroy() {
    if (this.#authUnsubscribe) {
      this.#authUnsubscribe();
    }
    this.#updateSubscription?.unsubscribe();
    this.#notificationSub?.unsubscribe();
    if (this.#levelUpTimeout) clearTimeout(this.#levelUpTimeout);
  }

  applyUpdate(): void {
    location.reload();
  }

  openNotifications(): void {
    this.#router.navigate(['/notifications']);
  }

  dismissLevelUp(): void {
    this.showLevelUp.set(false);
    if (this.#levelUpTimeout) {
      clearTimeout(this.#levelUpTimeout);
      this.#levelUpTimeout = null;
    }
  }

  async #autoLogin(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.#auth, email, password);
    } catch (signInError: unknown) {
      const code = (signInError as { code?: string })?.code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(this.#auth, email, password);
        } catch (createError) {
          console.error('Auto-login user creation failed:', createError);
        }
      } else {
        console.error('Auto-login sign-in failed:', signInError);
      }
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
