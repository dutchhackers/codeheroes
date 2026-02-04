import { Component, input, output } from '@angular/core';
import { LeaderboardEntry } from '../../../core/services/hq-data.service';
import * as LeaderboardUtils from '../utils/leaderboard.utils';

@Component({
  selector: 'app-leaderboard-preview',
  standalone: true,
  template: `
    <div class="leaderboard-section">
      <div class="section-header">
        <h3 class="section-title">
          <span class="trophy-icon">🏆</span>
          Weekly Leaderboard
        </h3>
        <button type="button" class="view-all-btn" (click)="onViewAll()" aria-label="View full leaderboard">
          View all
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-item"></div>
          }
        </div>
      } @else if (entries().length === 0) {
        <div class="empty-state">
          <p>No activity this week yet</p>
          <span class="empty-subtitle">Be the first to get on the board!</span>
        </div>
      } @else {
        <div class="leaderboard-list">
          @for (entry of entries(); track entry.userId; let i = $index) {
            <div class="leaderboard-item" [class.current-user]="entry.userId === currentUserId()">
              <div class="rank-badge" [class.top-three]="i < 3">
                @if (i === 0) {
                  <span class="medal gold" aria-label="First place">🥇</span>
                } @else if (i === 1) {
                  <span class="medal silver" aria-label="Second place">🥈</span>
                } @else if (i === 2) {
                  <span class="medal bronze" aria-label="Third place">🥉</span>
                } @else {
                  <span class="rank-number" [attr.aria-label]="'Rank ' + (i + 1)">#{{ i + 1 }}</span>
                }
              </div>
              <div class="user-profile">
                @if (entry.photoUrl) {
                  <img [src]="entry.photoUrl" [alt]="entry.displayName" class="user-avatar" loading="lazy" />
                } @else {
                  <div class="user-avatar-placeholder">
                    {{ LeaderboardUtils.getInitials(entry.displayName) }}
                  </div>
                }
                <span class="user-name">{{ LeaderboardUtils.formatName(entry.displayName) }}</span>
              </div>
              <div class="xp-badge">
                <span class="xp-value">+{{ LeaderboardUtils.formatXp(entry.xpGained) }}</span>
                <span class="xp-label">XP</span>
              </div>
            </div>
          }
        </div>

        @if (currentUserRank() && currentUserRank()! > 5) {
          <div class="user-rank-footer">
            <span>Your rank:</span>
            <strong>#{{ currentUserRank() }}</strong>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .leaderboard-section {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.25rem;
        margin: 1.25rem 0;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.875rem;
      }

      .section-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        letter-spacing: -0.02em;
      }

      .trophy-icon {
        font-size: 1.125rem;
      }

      .view-all-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.7);
        padding: 0.375rem 0.625rem;
        font-size: 0.8125rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-weight: 500;
      }

      .view-all-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.95);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .skeleton-item {
        height: 48px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.05) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 12px;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: rgba(255, 255, 255, 0.5);
      }

      .empty-state p {
        font-size: 1rem;
        margin: 0 0 0.5rem 0;
        font-weight: 500;
      }

      .empty-subtitle {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.35);
      }

      .leaderboard-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .leaderboard-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        transition: all 0.2s;
      }

      .leaderboard-item:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .leaderboard-item.current-user {
        background: color-mix(in srgb, var(--neon-cyan) 10%, transparent);
        border-color: color-mix(in srgb, var(--neon-cyan) 30%, transparent);
      }

      .rank-badge {
        min-width: 28px;
        text-align: center;
        font-weight: 600;
      }

      .medal {
        font-size: 1.25rem;
      }

      .rank-number {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.5);
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        min-width: 0;
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.1);
      }

      .user-avatar-placeholder {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.7);
        border: 2px solid rgba(255, 255, 255, 0.1);
      }

      .user-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.9);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .xp-badge {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.125rem;
      }

      .xp-value {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--neon-green);
      }

      .xp-label {
        font-size: 0.5625rem;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .user-rank-footer {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        text-align: center;
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.6);
      }

      .user-rank-footer strong {
        color: var(--neon-cyan);
        font-weight: 700;
        margin-left: 0.25rem;
      }

      @media (prefers-reduced-motion: reduce) {
        .skeleton-item {
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
