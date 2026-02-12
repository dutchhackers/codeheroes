import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserDto, UserStats } from '@codeheroes/types';
import { UserStatsService } from '../../core/services/user-stats.service';
import { UserCacheService } from '../../core/services/user-cache.service';
import { UserBadge } from '../../core/models/user-badge.model';
import { ProfileAvatarComponent } from '../profile/components/profile-avatar.component';
import { XpProgressComponent } from '../profile/components/xp-progress.component';
import { StatsGridComponent } from '../profile/components/stats-grid.component';
import { BadgesGridComponent } from '../profile/components/badges-grid.component';
import { BadgesModalComponent } from '../profile/components/badges-modal.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    ProfileAvatarComponent,
    XpProgressComponent,
    StatsGridComponent,
    BadgesGridComponent,
    BadgesModalComponent,
  ],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="flex items-center justify-between relative z-10">
        <button
          type="button"
          (click)="goBack()"
          aria-label="Go back"
          class="back-button rounded bg-black/50 border border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">Hero Profile</h1>
        <div class="w-11"></div> <!-- Spacer for centering -->
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-4 md:px-6 lg:px-8 pb-24">
      @if (isLoading()) {
        <div class="flex items-center justify-center py-20">
          <div class="text-xl md:text-2xl text-purple-400/70 animate-pulse" role="status" aria-live="polite">
            Loading...
          </div>
        </div>
      } @else if (!user()) {
        <div class="flex flex-col items-center justify-center py-20">
          <p class="text-lg md:text-2xl text-slate-500 text-center">Profile not found</p>
          <p class="text-sm md:text-base mt-3 text-slate-600 text-center">
            This user profile doesn't exist or has been removed.
          </p>
        </div>
      } @else {
        <div class="max-w-2xl mx-auto py-8">
          <!-- Avatar -->
          <app-profile-avatar [photoUrl]="user()?.photoUrl ?? null" [displayName]="user()?.displayName ?? ''" />

          <!-- Name and Level -->
          <div class="text-center mb-4">
            <h2 class="text-xl md:text-2xl font-bold text-white">
              {{ user()?.displayName || 'Unknown' }}
            </h2>
            <p
              class="text-sm md:text-base text-purple-400 mt-1"
              aria-label="Current level {{ stats()?.level ?? 1 }}"
            >
              Level {{ stats()?.level ?? 1 }}
            </p>
            @if (user()?.createdAt) {
              <p class="text-xs text-slate-500 mt-1">Hero Since {{ formatMemberSince(user()?.createdAt) }}</p>
            }
          </div>

          <!-- XP Progress -->
          <app-xp-progress [stats]="stats()" />

          <!-- Stats Grid -->
          <app-stats-grid [stats]="stats()" />

          <!-- Badges -->
          <app-badges-grid [badges]="badges()" (viewAll)="showBadgesModal.set(true)" />
        </div>
      }
    </main>

    <!-- Badges Modal -->
    @if (showBadgesModal()) {
      <app-badges-modal [badges]="badges()" (dismiss)="showBadgesModal.set(false)" />
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .back-button {
        padding: 0.625rem;
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class UserProfileComponent implements OnInit, OnDestroy {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #userStatsService = inject(UserStatsService);
  readonly #userCacheService = inject(UserCacheService);

  #routeSubscription: Subscription | null = null;
  #profileSubscription: Subscription | null = null;
  #badgesSubscription: Subscription | null = null;

  user = signal<UserDto | null>(null);
  stats = signal<UserStats | null>(null);
  badges = signal<UserBadge[]>([]);
  isLoading = signal(true);
  showBadgesModal = signal(false);

  ngOnInit() {
    // Get userId from route params
    this.#routeSubscription = this.#route.params.subscribe((params) => {
      const userId = params['id'];
      if (userId) {
        this.#cleanupProfileSubscriptions();
        this.#loadProfile(userId);
      } else {
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.#routeSubscription?.unsubscribe();
    this.#cleanupProfileSubscriptions();
  }

  #cleanupProfileSubscriptions() {
    this.#profileSubscription?.unsubscribe();
    this.#badgesSubscription?.unsubscribe();
  }

  async #loadProfile(userId: string) {
    await this.#userCacheService.loadUsers();

    // Subscribe to profile data
    this.#profileSubscription = this.#userStatsService.getAnyUserProfile(userId).subscribe({
      next: ({ user, stats }) => {
        this.user.set(user);
        this.stats.set(stats);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load profile:', error);
        this.isLoading.set(false);
      },
    });

    // Subscribe to badges
    this.#badgesSubscription = this.#userStatsService.getUserBadges(userId).subscribe({
      next: (badges) => {
        this.badges.set(badges);
      },
      error: (error) => {
        console.error('Failed to load badges:', error);
      },
    });
  }

  formatMemberSince(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  goBack() {
    this.#router.navigate(['/search']);
  }
}
