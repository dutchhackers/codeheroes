import { Component, input } from '@angular/core';
import { WeeklyStats } from '../../../core/services/hq-data.service';

interface StatItem {
  value: number | string;
  label: string;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-weekly-stats',
  standalone: true,
  template: `
    <div class="weekly-stats-section">
      <h3 class="section-title">This Week</h3>
      <div class="stats-grid">
        @for (stat of statsItems(); track stat.label) {
          <div class="stat-card" [style.--accent-color]="stat.color" role="group" [attr.aria-label]="stat.value + ' ' + stat.label">
            <div class="stat-icon">{{ stat.icon }}</div>
            <div class="stat-content">
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .weekly-stats-section {
        margin: 1.25rem 0;
      }

      .section-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin: 0 0 0.75rem 0;
        letter-spacing: -0.02em;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.625rem;
      }

      @media (min-width: 640px) {
        .stats-grid {
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
      }

      .stat-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 0.875rem 0.75rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        border-color: var(--accent-color);
        background: rgba(255, 255, 255, 0.08);
      }

      .stat-icon {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: color-mix(in srgb, var(--accent-color) 15%, transparent);
        color: var(--accent-color);
        font-size: 1.125rem;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        text-align: center;
      }

      .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.95);
        line-height: 1;
      }

      .stat-label {
        font-size: 0.6875rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 500;
      }

      @media (min-width: 640px) {
        .stat-card {
          padding: 1.25rem 1rem;
          gap: 0.75rem;
        }

        .stat-icon {
          width: 32px;
          height: 32px;
          font-size: 1.25rem;
        }

        .stat-value {
          font-size: 1.75rem;
        }

        .stat-label {
          font-size: 0.8rem;
        }
      }
    `,
  ],
})
export class WeeklyStatsComponent {
  stats = input<WeeklyStats | null>(null);

  statsItems(): StatItem[] {
    const s = this.stats();
    if (!s) {
      return [
        { value: '0', label: 'XP Earned', color: 'var(--neon-cyan)', icon: '⚡' },
        { value: 0, label: 'PRs Created', color: 'var(--neon-purple)', icon: '🔀' },
        { value: 0, label: 'PRs Merged', color: 'var(--neon-green)', icon: '✅' },
        { value: 0, label: 'Reviews', color: 'var(--neon-orange)', icon: '👁️' },
      ];
    }

    return [
      { value: this.formatXp(s.xpGained), label: 'XP Earned', color: 'var(--neon-cyan)', icon: '⚡' },
      { value: s.prsCreated, label: 'PRs Created', color: 'var(--neon-purple)', icon: '🔀' },
      { value: s.prsMerged, label: 'PRs Merged', color: 'var(--neon-green)', icon: '✅' },
      { value: s.reviewsSubmitted, label: 'Reviews', color: 'var(--neon-orange)', icon: '👁️' },
    ];
  }

  formatXp(xp: number): string {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  }
}
