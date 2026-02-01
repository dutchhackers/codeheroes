import { Component, input, output } from '@angular/core';
import { LeaderboardEntry } from '../../../core/services/hq-data.service';
import * as LeaderboardUtils from '../utils/leaderboard.utils';

@Component({
  selector: 'app-leaderboard-preview',
  standalone: true,
  template: `
    <div class="leaderboard-container card-glow-yellow">
      <div class="section-header">
        <h3 class="section-title">
          <span class="trophy">🏆</span>
          WEEKLY LEADERBOARD
        </h3>
        <button
          type="button"
          class="see-all-button"
          (click)="onViewAll()"
          aria-label="View full leaderboard"
        >
          See all
          <span class="arrow">→</span>
        </button>
      </div>

      @if (isLoading()) {
        <div class="skeleton-loader" role="status" aria-live="polite" aria-label="Loading leaderboard">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row"></div>
          }
        </div>
      } @else if (entries().length === 0) {
        <div class="empty-state">No activity this week yet. Be the first!</div>
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
                    {{ LeaderboardUtils.getInitials(entry.displayName) }}
                  </div>
                }
                <span class="name">{{ LeaderboardUtils.formatName(entry.displayName) }}</span>
              </div>
              <span class="xp-gained">+{{ LeaderboardUtils.formatXp(entry.xpGained) }}</span>
              @if (entry.userId === currentUserId()) {
                <span class="current-marker" aria-label="This is you">←</span>
              }
            </div>
          }
        </div>

        @if (currentUserRank() && currentUserRank()! > 3) {
          <div class="current-user-rank">
            Your rank: <span class="rank-value">#{{ currentUserRank() }}</span>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .leaderboard-container {
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .section-title {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin: 0;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .trophy {
        font-size: 1rem;
      }

      .see-all-button {
        background: transparent;
        border: none;
        color: var(--neon-yellow);
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .see-all-button:hover {
        background: rgba(255, 221, 0, 0.1);
        text-shadow: 0 0 8px var(--neon-yellow);
      }

      .see-all-button .arrow {
        transition: transform 0.2s;
      }

      .see-all-button:hover .arrow {
        transform: translateX(2px);
      }

      .empty-state {
        text-align: center;
        padding: 1.5rem;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.85rem;
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
        padding: 0.5rem 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 6px;
        transition: all 0.2s ease;
      }

      .leaderboard-entry:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      .leaderboard-entry.is-current-user {
        background: rgba(0, 245, 255, 0.1);
        border: 1px solid rgba(0, 245, 255, 0.3);
      }

      .rank {
        min-width: 2rem;
        text-align: center;
        font-weight: bold;
        font-size: 0.9rem;
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
        gap: 0.5rem;
        flex: 1;
        min-width: 0;
      }

      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
      }

      .avatar-placeholder {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(191, 0, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.65rem;
        font-weight: bold;
        color: var(--neon-purple);
        flex-shrink: 0;
      }

      .name {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.9);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .xp-gained {
        font-size: 0.8rem;
        font-weight: bold;
        color: var(--neon-green);
        text-shadow: 0 0 8px color-mix(in srgb, var(--neon-green) 40%, transparent);
        white-space: nowrap;
      }

      .current-marker {
        color: var(--neon-cyan);
        font-size: 0.9rem;
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
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        text-align: center;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
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
        height: 48px;
        background: linear-gradient(90deg, #1a1a2e 25%, #2a2a4e 50%, #1a1a2e 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 6px;
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
export class LeaderboardPreviewComponent {
  entries = input<LeaderboardEntry[]>([]);
  currentUserRank = input<number | null>(null);
  currentUserId = input<string | null>(null);
  isLoading = input<boolean>(false);

  viewAll = output<void>();

  // Expose utility functions to template
  readonly LeaderboardUtils = LeaderboardUtils;

  onViewAll() {
    this.viewAll.emit();
  }
}
