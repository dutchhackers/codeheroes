import { Component, input } from '@angular/core';
import { WeeklyStats } from '../../../core/services/hq-data.service';

export type StatsDisplayPeriod = 'day' | 'week';

interface StatItem {
  value: number | string;
  label: string;
  color: string;
  icon?: string;
}

@Component({
  selector: 'app-period-stats',
  standalone: true,
  template: `
    <div class="period-stats-container">
      <h3 class="section-title">{{ sectionTitle() }}</h3>
      <div class="stats-grid">
        @for (stat of statsItems(); track stat.label) {
          <div
            class="stat-card"
            [style.--stat-color]="stat.color"
            role="group"
            [attr.aria-label]="stat.value + ' ' + stat.label"
          >
            @if (stat.icon) {
              <span class="stat-icon" aria-hidden="true">{{ stat.icon }}</span>
            }
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .period-stats-container {
        margin: 1rem 0;
      }

      .section-title {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 0.75rem;
        font-weight: 600;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      @media (min-width: 480px) {
        .stats-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      .stat-card {
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        border: 2px solid var(--stat-color);
        border-radius: 8px;
        padding: 1rem 0.75rem;
        text-align: center;
        transition: all 0.2s ease;
        box-shadow:
          0 0 8px var(--stat-color),
          0 0 16px color-mix(in srgb, var(--stat-color) 30%, transparent),
          inset 0 0 12px color-mix(in srgb, var(--stat-color) 5%, transparent);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .stat-card:hover {
        box-shadow:
          0 0 12px var(--stat-color),
          0 0 24px color-mix(in srgb, var(--stat-color) 40%, transparent),
          inset 0 0 16px color-mix(in srgb, var(--stat-color) 8%, transparent);
        transform: translateY(-2px);
      }

      @media (hover: none) {
        .stat-card:active {
          box-shadow:
            0 0 12px var(--stat-color),
            0 0 24px color-mix(in srgb, var(--stat-color) 40%, transparent),
            inset 0 0 16px color-mix(in srgb, var(--stat-color) 8%, transparent);
        }
      }

      .stat-icon {
        font-size: 1.25rem;
        line-height: 1;
        margin-bottom: 0.125rem;
      }

      .stat-value {
        display: block;
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--stat-color);
        text-shadow: 0 0 10px color-mix(in srgb, var(--stat-color) 50%, transparent);
      }

      .stat-label {
        display: block;
        font-size: 0.6rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      @media (min-width: 768px) {
        .stat-value {
          font-size: 2rem;
        }

        .stat-label {
          font-size: 0.7rem;
        }
      }
    `,
  ],
})
export class PeriodStatsComponent {
  period = input<StatsDisplayPeriod>('week');
  weeklyStats = input<WeeklyStats | null>(null);

  sectionTitle = (): string => {
    return this.period() === 'day' ? 'TODAY' : 'THIS WEEK';
  };

  statsItems = (): StatItem[] => {
    const s = this.weeklyStats();

    if (!s) {
      return [
        { value: 0, label: 'PRs Created', color: 'var(--neon-purple)', icon: '📋' },
        { value: 0, label: 'PRs Merged', color: 'var(--neon-green)', icon: '✅' },
        { value: 0, label: 'Reviews', color: 'var(--neon-orange)', icon: '👀' },
        { value: 0, label: 'Pushes', color: 'var(--neon-cyan)', icon: '🚀' },
      ];
    }

    return [
      { value: s.prsCreated, label: 'PRs Created', color: 'var(--neon-purple)', icon: '📋' },
      { value: s.prsMerged, label: 'PRs Merged', color: 'var(--neon-green)', icon: '✅' },
      { value: s.reviewsSubmitted, label: 'Reviews', color: 'var(--neon-orange)', icon: '👀' },
      { value: s.codePushes, label: 'Pushes', color: 'var(--neon-cyan)', icon: '🚀' },
    ];
  };
}
