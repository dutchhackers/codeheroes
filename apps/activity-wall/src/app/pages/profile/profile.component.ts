import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Activity, UserDto, UserStats } from '@codeheroes/types';
import { UserStatsService } from '../../core/services/user-stats.service';
import { UserCacheService } from '../../core/services/user-cache.service';
import { ProfileAvatarComponent } from './components/profile-avatar.component';
import { XpProgressComponent } from './components/xp-progress.component';
import { StatsGridComponent } from './components/stats-grid.component';
import { ActivityItemComponent } from '../../components/activity-item.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ProfileAvatarComponent,
    XpProgressComponent,
    StatsGridComponent,
    ActivityItemComponent,
  ],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-8 md:py-5">
      <div class="flex items-center justify-between relative z-10">
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">
          Profile
        </h1>
        <div class="flex items-center gap-2 px-3 py-1.5 rounded border border-green-500/30 bg-black/50">
          <span class="w-2.5 h-2.5 rounded-full bg-green-400 live-indicator"></span>
          <span class="text-sm md:text-base text-green-400 font-mono">LIVE</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-4 md:px-8 pb-24">
      @if (isLoading()) {
        <div class="flex items-center justify-center py-20">
          <div class="text-xl md:text-2xl text-purple-400/70 animate-pulse font-mono">Loading...</div>
        </div>
      } @else if (!user()) {
        <div class="flex flex-col items-center justify-center py-20">
          <p class="text-lg md:text-2xl text-slate-500 font-mono text-center">
            Profile not found
          </p>
          <p class="text-sm md:text-base mt-3 text-slate-600 font-mono text-center">
            Your user profile hasn't been set up yet.
          </p>
        </div>
      } @else {
        <div class="max-w-2xl mx-auto py-8">
          <!-- Avatar -->
          <app-profile-avatar
            [photoUrl]="user()?.photoUrl ?? null"
            [displayName]="user()?.displayName ?? ''"
          />

          <!-- Name and Level -->
          <div class="text-center mb-4">
            <h2 class="text-xl md:text-2xl font-bold text-white uppercase tracking-wide">
              {{ formatDisplayName(user()?.displayName ?? '') }}
            </h2>
            <p class="text-sm md:text-base text-purple-400 font-mono mt-1">
              Level {{ stats()?.level ?? 1 }}
            </p>
          </div>

          <!-- XP Progress -->
          <app-xp-progress [stats]="stats()" />

          <!-- Stats Grid -->
          <app-stats-grid [stats]="stats()" />

          <!-- Recent Activity -->
          @if (activities().length > 0) {
            <div class="mt-8">
              <h3 class="text-sm uppercase tracking-wider text-slate-500 mb-4 font-mono">
                Recent Activity
              </h3>
              <div class="flex flex-col gap-4">
                @for (activity of activities(); track activity.id) {
                  <app-activity-item
                    [activity]="activity"
                    [userInfo]="getUserInfo(activity.userId)"
                    (selectActivity)="onSelectActivity($event)"
                  />
                }
              </div>
            </div>
          }
        </div>
      }
    </main>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class ProfileComponent implements OnInit, OnDestroy {
  readonly #userStatsService = inject(UserStatsService);
  readonly #userCacheService = inject(UserCacheService);

  #profileSubscription: Subscription | null = null;
  #activitiesSubscription: Subscription | null = null;

  user = signal<UserDto | null>(null);
  stats = signal<UserStats | null>(null);
  activities = signal<Activity[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.#loadProfile();
  }

  ngOnDestroy() {
    this.#profileSubscription?.unsubscribe();
    this.#activitiesSubscription?.unsubscribe();
  }

  async #loadProfile() {
    // Load user cache for activity items
    await this.#userCacheService.loadUsers();

    // Subscribe to profile data
    this.#profileSubscription = this.#userStatsService.getCurrentUserProfile().subscribe({
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

    // Subscribe to activities
    this.#activitiesSubscription = this.#userStatsService.getCurrentUserActivities(5).subscribe({
      next: (activities) => {
        this.activities.set(activities);
      },
      error: (error) => {
        console.error('Failed to load activities:', error);
      },
    });
  }

  formatDisplayName(name: string): string {
    if (!name) return 'Unknown';

    // Similar to the techUsername logic but just uppercase
    const upper = name.toUpperCase();
    const parts = upper.split(/\s+/);

    if (parts.length >= 2) {
      // "Sander Elderhorst" -> "SANDER.E"
      return `${parts[0]}.${parts[1].charAt(0)}`;
    }

    // Single word handling
    const breakPoints = ['NIGHT', 'CODE', 'DARK', 'FIRE', 'STAR', 'CYBER', 'TECH', 'MEGA', 'ULTRA'];
    for (const prefix of breakPoints) {
      if (upper.startsWith(prefix) && upper.length > prefix.length) {
        return `${prefix}.${upper.slice(prefix.length)}`;
      }
    }

    if (upper.length >= 8) {
      const mid = Math.floor(upper.length / 2);
      return `${upper.slice(0, mid)}.${upper.slice(mid)}`;
    }

    return upper;
  }

  getUserInfo(userId: string) {
    return this.#userCacheService.getUserInfo(userId);
  }

  onSelectActivity(activity: Activity) {
    // Could open debug panel or show details
    console.log('Selected activity:', activity);
  }
}
