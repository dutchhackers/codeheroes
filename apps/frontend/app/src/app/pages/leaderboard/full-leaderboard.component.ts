import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  LeaderboardService,
  LeaderboardEntry,
  ProjectLeaderboardEntry,
} from '../../core/services/leaderboard.service';
import * as LeaderboardUtils from '../hq/utils/leaderboard.utils';

type LeaderboardPeriod = 'week' | 'day';
type LeaderboardType = 'heroes' | 'bots' | 'projects';

@Component({
  selector: 'app-full-leaderboard',
  standalone: true,
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="flex items-center gap-3 relative z-10">
        <button type="button" (click)="goBack()" aria-label="Back to leaderboard" class="back-button">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">{{ pageTitle() }}</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-4 md:px-6 lg:px-8 pb-24">
      <div class="max-w-2xl mx-auto py-4 md:py-6">
        <!-- Period Toggle -->
        <div class="period-toggle">
          <button
            type="button"
            class="toggle-pill"
            [class.toggle-pill-active]="activePeriod() === 'week'"
            (click)="switchPeriod('week')"
          >
            This Week
          </button>
          <button
            type="button"
            class="toggle-pill"
            [class.toggle-pill-active]="activePeriod() === 'day'"
            (click)="switchPeriod('day')"
          >
            Today
          </button>
        </div>

        @if (isLoading()) {
          <div class="skeleton-loader">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="skeleton-row"></div>
            }
          </div>
        } @else if (userEntries().length === 0 && projectEntries().length === 0) {
          <div class="empty-state">
            No activity {{ activePeriod() === 'day' ? 'today' : 'this week' }} yet.
          </div>
        } @else if (leaderboardType !== 'projects') {
          <div class="leaderboard-list">
            @for (entry of userEntries(); track entry.userId; let i = $index) {
              <div
                class="leaderboard-entry"
                [class.is-current-user]="entry.userId === currentUserId()"
              >
                <span class="rank" [class.gold]="i === 0" [class.silver]="i === 1" [class.bronze]="i === 2">
                  @if (i === 0) { 🥇 }
                  @else if (i === 1) { 🥈 }
                  @else if (i === 2) { 🥉 }
                  @else { #{{ i + 1 }} }
                </span>
                <div class="user-info">
                  @if (entry.photoUrl) {
                    <img [src]="entry.photoUrl" [alt]="entry.displayName" class="avatar" loading="lazy" />
                  } @else {
                    <div class="avatar-placeholder">
                      {{ getInitials(entry.displayName) }}
                    </div>
                  }
                  <span class="name">{{ formatName(entry.displayName, 18, 15) }}</span>
                </div>
                <span class="xp-gained">+{{ formatXp(entry.xpGained) }}</span>
              </div>
            }
          </div>
        } @else {
          <div class="leaderboard-list">
            @for (entry of projectEntries(); track entry.projectId; let i = $index) {
              <div class="leaderboard-entry">
                <span class="rank" [class.gold]="i === 0" [class.silver]="i === 1" [class.bronze]="i === 2">
                  @if (i === 0) { 🥇 }
                  @else if (i === 1) { 🥈 }
                  @else if (i === 2) { 🥉 }
                  @else { #{{ i + 1 }} }
                </span>
                <div class="user-info">
                  <div class="project-avatar-placeholder">
                    {{ getInitials(entry.name) }}
                  </div>
                  <span class="name">{{ formatName(entry.name, 18, 15) }}</span>
                </div>
                <span class="xp-gained">+{{ formatXp(entry.xpGained) }}</span>
              </div>
            }
          </div>
        }
      </div>
    </main>
  `,
  styles: [
    `
      :host { display: block; }

      .back-button {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 0.5rem;
        min-width: 40px;
        min-height: 40px;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .back-button:hover {
        color: white;
        border-color: rgba(255, 255, 255, 0.4);
      }

      .period-toggle {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .toggle-pill {
        padding: 0.5rem 1.25rem;
        border-radius: 9999px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: rgba(0, 0, 0, 0.3);
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .toggle-pill:hover {
        border-color: rgba(6, 182, 212, 0.5);
        color: white;
      }

      .toggle-pill-active {
        border-color: var(--neon-cyan);
        background: rgba(6, 182, 212, 0.15);
        color: var(--neon-cyan);
        box-shadow: 0 0 12px rgba(6, 182, 212, 0.2);
      }

      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.9rem;
      }

      .leaderboard-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .leaderboard-entry {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        transition: all 0.2s;
      }

      .leaderboard-entry:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .leaderboard-entry.is-current-user {
        background: rgba(0, 245, 255, 0.1);
        border-color: rgba(0, 245, 255, 0.3);
      }

      .rank {
        min-width: 2.25rem;
        text-align: center;
        font-weight: bold;
        font-size: 0.95rem;
      }

      .rank.gold { color: #ffd700; }
      .rank.silver { color: #c0c0c0; }
      .rank.bronze { color: #cd7f32; }
      .rank:not(.gold):not(.silver):not(.bronze) { color: rgba(255, 255, 255, 0.5); }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        flex: 1;
        min-width: 0;
      }

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }

      .avatar-placeholder {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.7);
        flex-shrink: 0;
        border: 2px solid rgba(255, 255, 255, 0.1);
      }

      .project-avatar-placeholder {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.7);
        flex-shrink: 0;
        border: 2px solid rgba(255, 255, 255, 0.1);
      }

      .name {
        font-size: 0.9375rem;
        color: rgba(255, 255, 255, 0.9);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .xp-gained {
        font-size: 0.9rem;
        font-weight: bold;
        color: var(--neon-green);
        white-space: nowrap;
      }

      .skeleton-loader {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .skeleton-row {
        height: 56px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.05) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 10px;
      }

      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      @media (prefers-reduced-motion: reduce) {
        .skeleton-row { animation: none; }
      }
    `,
  ],
})
export class FullLeaderboardComponent implements OnInit, OnDestroy {
  readonly #leaderboardService = inject(LeaderboardService);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  leaderboardType: LeaderboardType = 'heroes';
  activePeriod = signal<LeaderboardPeriod>('week');
  isLoading = signal(true);
  userEntries = signal<LeaderboardEntry[]>([]);
  projectEntries = signal<ProjectLeaderboardEntry[]>([]);
  currentUserId = signal<string | null>(null);

  pageTitle = signal('Leaderboard');

  #dataSub: Subscription | null = null;

  readonly getInitials = LeaderboardUtils.getInitials;
  readonly formatName = LeaderboardUtils.formatName;
  readonly formatXp = LeaderboardUtils.formatXp;

  ngOnInit() {
    this.leaderboardType = (this.#route.snapshot.data['type'] as LeaderboardType) || 'heroes';

    const titles: Record<LeaderboardType, string> = {
      heroes: 'Heroes',
      bots: 'Bots',
      projects: 'Projects',
    };
    this.pageTitle.set(titles[this.leaderboardType]);

    this.#loadData();
  }

  ngOnDestroy() {
    this.#dataSub?.unsubscribe();
  }

  switchPeriod(period: LeaderboardPeriod) {
    if (period !== this.activePeriod()) {
      this.activePeriod.set(period);
      this.#loadData();
    }
  }

  goBack() {
    this.#router.navigate(['/leaderboard']);
  }

  #loadData() {
    this.isLoading.set(true);
    this.#dataSub?.unsubscribe();

    const period = this.activePeriod();

    if (this.leaderboardType === 'projects') {
      this.#dataSub = this.#leaderboardService.getProjectLeaderboard(period).subscribe({
        next: (entries) => {
          this.projectEntries.set(entries);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    } else {
      const userType = this.leaderboardType === 'bots' ? 'bot' : 'user';
      this.#dataSub = this.#leaderboardService.getUserLeaderboard(period, userType).subscribe({
        next: ({ entries, currentUserId }) => {
          this.userEntries.set(entries);
          this.currentUserId.set(currentUserId);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }
}
