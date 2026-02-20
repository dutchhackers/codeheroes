import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rank-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a routerLink="/leaderboard" class="rank-card" aria-label="View leaderboard">
      @if (isLoading()) {
        <div class="rank-card-loading">
          <div class="loading-bar"></div>
        </div>
      } @else {
        <div class="rank-card-content">
          <div class="rank-info">
            <span class="rank-icon">🏆</span>
            @if (rank() !== null) {
              <span class="rank-text">
                Your Rank: <strong class="rank-value">#{{ rank() }}</strong> this week
              </span>
            } @else {
              <span class="rank-text">No ranking yet this week</span>
            }
          </div>
          @if (xpGained() > 0) {
            <div class="xp-gained">
              <span class="xp-value">+{{ formatXp(xpGained()) }}</span>
            </div>
          }
          <svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </div>
      }
    </a>
  `,
  styles: [
    `
      .rank-card {
        display: block;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid color-mix(in srgb, var(--neon-cyan) 30%, transparent);
        border-radius: 12px;
        padding: 1rem 1.25rem;
        margin: 1.25rem 0;
        text-decoration: none;
        transition: all 0.2s;
        cursor: pointer;
      }

      .rank-card:hover {
        background: rgba(6, 182, 212, 0.08);
        border-color: color-mix(in srgb, var(--neon-cyan) 50%, transparent);
        box-shadow: 0 0 20px rgba(6, 182, 212, 0.15);
      }

      .rank-card-loading {
        height: 24px;
        display: flex;
        align-items: center;
      }

      .loading-bar {
        height: 16px;
        width: 60%;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.05) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
      }

      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      .rank-card-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .rank-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        min-width: 0;
      }

      .rank-icon {
        font-size: 1.125rem;
        flex-shrink: 0;
      }

      .rank-text {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.7);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .rank-value {
        color: var(--neon-cyan);
        font-weight: 700;
      }

      .xp-gained {
        flex-shrink: 0;
      }

      .xp-value {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--neon-green);
      }

      .chevron {
        color: rgba(255, 255, 255, 0.4);
        flex-shrink: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        .loading-bar { animation: none; }
      }
    `,
  ],
})
export class RankCardComponent {
  rank = input<number | null>(null);
  xpGained = input<number>(0);
  isLoading = input<boolean>(false);

  formatXp(xp: number): string {
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K XP`;
    return `${xp} XP`;
  }
}
