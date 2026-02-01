import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { HqDataService, LeaderboardEntry } from '../../../core/services/hq-data.service';

export type LeaderboardPeriod = 'weekly' | 'daily';

@Component({
  selector: 'app-leaderboard-modal',
  standalone: true,
  template: `
    <div
      class="modal-backdrop"
      (click)="onBackdropClick($event)"
      (keydown)="onBackdropKeydown($event)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
    >
      <div class="modal-content" #modalContent tabindex="-1">
        <div class="modal-header">
          <h2 id="modal-title" class="modal-title">
            <span class="trophy">🏆</span>
            Leaderboard
          </h2>
          <button type="button" class="close-button" (click)="onClose()" aria-label="Close dialog">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Period Toggle -->
        <div class="period-toggle" role="tablist" aria-label="Leaderboard period">
          <button
            type="button"
            role="tab"
            id="tab-weekly"
            class="toggle-button"
            [class.active]="activePeriod() === 'weekly'"
            [attr.aria-selected]="activePeriod() === 'weekly'"
            aria-controls="leaderboard-tabpanel"
            (click)="switchPeriod('weekly')"
          >
            WEEKLY
          </button>
          <button
            type="button"
            role="tab"
            id="tab-daily"
            class="toggle-button"
            [class.active]="activePeriod() === 'daily'"
            [attr.aria-selected]="activePeriod() === 'daily'"
            aria-controls="leaderboard-tabpanel"
            (click)="switchPeriod('daily')"
          >
            DAILY
          </button>
        </div>

        <!-- Leaderboard Content -->
        <div
          class="modal-body"
          role="tabpanel"
          id="leaderboard-tabpanel"
          [attr.aria-labelledby]="activePeriod() === 'weekly' ? 'tab-weekly' : 'tab-daily'"
        >
          @if (isLoading()) {
            <div class="skeleton-loader" role="status" aria-live="polite" aria-label="Loading leaderboard">
              @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
                <div class="skeleton-row"></div>
              }
            </div>
          } @else if (entries().length === 0) {
            <div class="empty-state">
              No activity {{ activePeriod() === 'daily' ? 'today' : 'this week' }} yet. Be the first!
            </div>
          } @else {
            <div class="leaderboard-list">
              @for (entry of entries(); track entry.userId; let i = $index) {
                <div
                  class="leaderboard-entry"
                  [class.is-current-user]="entry.userId === currentUserId()"
                  [class.top-three]="i < 3"
                >
                  <span class="rank" [class.gold]="i === 0" [class.silver]="i === 1" [class.bronze]="i === 2">
                    @if (i === 0) {
                      🥇
                    } @else if (i === 1) {
                      🥈
                    } @else if (i === 2) {
                      🥉
                    } @else {
                      #{{ i + 1 }}
                    }
                  </span>
                  <div class="user-info">
                    @if (entry.photoUrl) {
                      <img [src]="entry.photoUrl" [alt]="entry.displayName" class="avatar" loading="lazy" />
                    } @else {
                      <div class="avatar-placeholder">
                        {{ getInitials(entry.displayName) }}
                      </div>
                    }
                    <span class="name">{{ formatName(entry.displayName) }}</span>
                  </div>
                  <span class="xp-gained">+{{ formatXp(entry.xpGained) }}</span>
                  @if (entry.userId === currentUserId()) {
                    <span class="current-marker" aria-label="This is you">←</span>
                  }
                </div>
              }
            </div>
          }
        </div>

        @if (currentUserRank() && currentUserRank()! > entries().length && !isLoading()) {
          <div class="current-user-rank">
            Your rank: <span class="rank-value">#{{ currentUserRank() }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        z-index: 100;
        padding: 0;
      }

      @media (min-width: 640px) {
        .modal-backdrop {
          align-items: center;
          padding: 1rem;
        }
      }

      .modal-content {
        background: linear-gradient(135deg, rgba(15, 15, 25, 0.98), rgba(25, 15, 35, 0.98));
        border: 2px solid var(--neon-yellow);
        border-radius: 16px 16px 0 0;
        width: 100%;
        max-width: 500px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow:
          0 0 20px rgba(255, 221, 0, 0.2),
          0 0 40px rgba(255, 221, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
        animation: slideUp 0.3s ease-out;
      }

      @media (min-width: 640px) {
        .modal-content {
          border-radius: 16px;
          animation: fadeIn 0.2s ease-out;
        }
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }

      .modal-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: white;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .trophy {
        font-size: 1.25rem;
      }

      .close-button {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
        border-radius: 6px;
      }

      .close-button:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
      }

      .close-button svg {
        width: 20px;
        height: 20px;
      }

      .period-toggle {
        display: flex;
        gap: 0.5rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        flex-shrink: 0;
      }

      .toggle-button {
        flex: 1;
        padding: 0.625rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        cursor: pointer;
        transition: all 0.2s;
      }

      .toggle-button:hover:not(.active) {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.7);
      }

      .toggle-button.active {
        background: rgba(255, 221, 0, 0.15);
        border-color: var(--neon-yellow);
        color: var(--neon-yellow);
        box-shadow: 0 0 12px rgba(255, 221, 0, 0.2);
      }

      .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 1.25rem;
        min-height: 300px;
        max-height: 50vh;
      }

      .empty-state {
        text-align: center;
        padding: 2rem 1rem;
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
        padding: 0.625rem 0.875rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        transition: all 0.2s ease;
      }

      .leaderboard-entry:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      .leaderboard-entry.is-current-user {
        background: rgba(0, 245, 255, 0.1);
        border: 1px solid rgba(0, 245, 255, 0.3);
        box-shadow: 0 0 15px rgba(0, 245, 255, 0.15);
      }

      .rank {
        min-width: 2.25rem;
        text-align: center;
        font-weight: bold;
        font-size: 0.95rem;
      }

      .rank.gold {
        color: #ffd700;
      }
      .rank.silver {
        color: #c0c0c0;
      }
      .rank.bronze {
        color: #cd7f32;
      }
      .rank:not(.gold):not(.silver):not(.bronze) {
        color: rgba(255, 255, 255, 0.5);
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        flex: 1;
        min-width: 0;
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
      }

      .avatar-placeholder {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(191, 0, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: bold;
        color: var(--neon-purple);
        flex-shrink: 0;
      }

      .name {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.9);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .xp-gained {
        font-size: 0.85rem;
        font-weight: bold;
        color: var(--neon-green);
        text-shadow: 0 0 8px color-mix(in srgb, var(--neon-green) 40%, transparent);
        white-space: nowrap;
      }

      .current-marker {
        color: var(--neon-cyan);
        font-size: 1rem;
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .current-user-rank {
        padding: 0.875rem 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        text-align: center;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.5);
        flex-shrink: 0;
      }

      .rank-value {
        color: var(--neon-cyan);
        font-weight: bold;
      }

      .skeleton-loader {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .skeleton-row {
        height: 52px;
        background: linear-gradient(90deg, #1a1a2e 25%, #2a2a4e 50%, #1a1a2e 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .modal-content {
          animation: none;
        }
        .skeleton-row {
          animation: none;
        }
        .current-marker {
          animation: none;
        }
      }
    `,
  ],
})
export class LeaderboardModalComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly #hqDataService = inject(HqDataService);

  dismiss = output<void>();

  readonly modalContent = viewChild<ElementRef<HTMLElement>>('modalContent');

  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    this.onClose();
  }

  activePeriod = signal<LeaderboardPeriod>('weekly');
  isLoading = signal(true);
  entries = signal<LeaderboardEntry[]>([]);
  currentUserRank = signal<number | null>(null);
  currentUserId = signal<string | null>(null);

  #leaderboardSub: Subscription | null = null;

  ngOnInit() {
    this.#loadLeaderboard();
  }

  ngAfterViewInit() {
    // Focus the modal content for keyboard accessibility
    this.modalContent()?.nativeElement?.focus();
  }

  ngOnDestroy() {
    this.#leaderboardSub?.unsubscribe();
  }

  switchPeriod(period: LeaderboardPeriod) {
    if (period !== this.activePeriod()) {
      this.activePeriod.set(period);
      this.#loadLeaderboard();
    }
  }

  onClose() {
    this.dismiss.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onBackdropKeydown(event: KeyboardEvent) {
    // Handle Enter/Space on backdrop as equivalent to click (accessibility)
    if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
      event.preventDefault();
      this.onClose();
    }
  }

  getInitials(name: string): string {
    return name
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  formatName(name: string): string {
    if (name.length <= 18) return name;
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1].charAt(0)}.`;
    }
    return name.slice(0, 15) + '...';
  }

  formatXp(xp: number): string {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K XP`;
    }
    return `${xp} XP`;
  }

  #loadLeaderboard() {
    this.isLoading.set(true);
    this.#leaderboardSub?.unsubscribe();

    const leaderboard$ =
      this.activePeriod() === 'weekly'
        ? this.#hqDataService.getWeeklyLeaderboard(0) // 0 = no limit, get all entries
        : this.#hqDataService.getDailyLeaderboard(0);

    this.#leaderboardSub = leaderboard$.subscribe({
      next: ({ entries, currentUserRank, currentUserId }) => {
        this.entries.set(entries);
        this.currentUserRank.set(currentUserRank);
        this.currentUserId.set(currentUserId);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load leaderboard:', error);
        this.isLoading.set(false);
      },
    });
  }
}
