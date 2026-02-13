import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { UserDto, UserStats } from '@codeheroes/types';
import { UserStatsService } from '../../core/services/user-stats.service';
import { UserCacheService } from '../../core/services/user-cache.service';
import { UserBadge } from '../../core/models/user-badge.model';
import { ProfileAvatarComponent } from './components/profile-avatar.component';
import { XpProgressComponent } from './components/xp-progress.component';
import { StatsGridComponent } from './components/stats-grid.component';
import { BadgesGridComponent } from './components/badges-grid.component';
import { ProfileEditModalComponent } from './components/profile-edit-modal.component';
import { BadgesModalComponent } from './components/badges-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ProfileAvatarComponent,
    XpProgressComponent,
    StatsGridComponent,
    BadgesGridComponent,
    ProfileEditModalComponent,
    BadgesModalComponent,
  ],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="flex items-center justify-between relative z-10">
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">Profile</h1>
        <div class="flex items-center gap-2">
          <button
              type="button"
              (click)="openSettings()"
              aria-label="Settings"
              class="header-icon-button rounded bg-black/50 border border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          <button
              type="button"
              (click)="logout()"
              aria-label="Sign out"
              class="header-icon-button rounded bg-black/50 border border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
        </div>
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
            Your user profile hasn't been set up yet.
          </p>
        </div>
      } @else {
        <div class="max-w-2xl mx-auto py-8">
          <!-- Avatar -->
          <app-profile-avatar [photoUrl]="user()?.photoUrl ?? null" [displayName]="user()?.displayName ?? ''" />

          <!-- Name and Level -->
          <div class="text-center mb-4">
            <div class="inline-flex items-center gap-2">
              <h2 class="text-xl md:text-2xl font-bold text-white">
                {{ user()?.displayName || 'Unknown' }}
              </h2>
              <button type="button" class="edit-button" (click)="openEditModal()" aria-label="Edit profile">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            </div>
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
          <app-badges-grid
            [badges]="badges()"
            (viewAll)="showBadgesModal.set(true)"
            (badgeClick)="onBadgeClick($event)"
          />

        </div>
      }
    </main>

    <!-- Badges Modal -->
    @if (showBadgesModal()) {
      <app-badges-modal
        [badges]="badges()"
        [initialSelectedBadgeId]="selectedBadgeId()"
        (dismiss)="closeBadgesModal()"
      />
    }

    <!-- Edit Profile Modal -->
    @if (showEditModal()) {
      <app-profile-edit-modal
        [currentDisplayName]="user()?.displayName ?? ''"
        [isSaving]="isSavingProfile()"
        [saveError]="profileSaveError()"
        (dismiss)="closeEditModal()"
        (save)="saveDisplayName($event)"
      />
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .header-icon-button {
        padding: 0.625rem;
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .edit-button {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 0.625rem;
        min-width: 44px;
        min-height: 44px;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .edit-button:hover {
        color: var(--neon-cyan);
        border-color: var(--neon-cyan);
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
      }
    `,
  ],
})
export class ProfileComponent implements OnInit, OnDestroy {
  readonly #auth = inject(Auth);
  readonly #router = inject(Router);
  readonly #userStatsService = inject(UserStatsService);
  readonly #userCacheService = inject(UserCacheService);

  #profileSubscription: Subscription | null = null;
  #badgesSubscription: Subscription | null = null;

  user = signal<UserDto | null>(null);
  stats = signal<UserStats | null>(null);
  badges = signal<UserBadge[]>([]);
  isLoading = signal(true);
  showEditModal = signal(false);
  showBadgesModal = signal(false);
  selectedBadgeId = signal<string | null>(null);
  isSavingProfile = signal(false);
  profileSaveError = signal<string | null>(null);

  ngOnInit() {
    this.#loadProfile();
  }

  ngOnDestroy() {
    this.#profileSubscription?.unsubscribe();
    this.#badgesSubscription?.unsubscribe();
  }

  #loadProfile() {
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

    // Subscribe to badges
    this.#badgesSubscription = this.#userStatsService.getCurrentUserBadges().subscribe({
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

  async logout() {
    try {
      await signOut(this.#auth);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  openSettings() {
    this.#router.navigate(['/settings']);
  }

  openEditModal() {
    this.profileSaveError.set(null);
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.profileSaveError.set(null);
  }

  async saveDisplayName(newName: string) {
    const currentUser = this.user();
    if (!currentUser?.id) return;

    this.isSavingProfile.set(true);
    this.profileSaveError.set(null);
    try {
      await this.#userStatsService.updateDisplayName(currentUser.id, newName);
      // Update the user cache so activity items show the new name
      this.#userCacheService.updateUserInCache(currentUser.id, {
        displayName: newName,
      });
      // Update the user signal for immediate UI feedback in profile header
      this.user.set({
        ...currentUser,
        displayName: newName,
      });
      this.closeEditModal();
    } catch (error) {
      console.error('Failed to update display name:', error);
      this.profileSaveError.set('Failed to save. Please try again.');
    } finally {
      this.isSavingProfile.set(false);
    }
  }

  onBadgeClick(badge: UserBadge) {
    this.selectedBadgeId.set(badge.id);
    this.showBadgesModal.set(true);
  }

  closeBadgesModal() {
    this.showBadgesModal.set(false);
    this.selectedBadgeId.set(null);
  }
}
