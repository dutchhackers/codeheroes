import { Component, input } from '@angular/core';
import { UserStats } from '@codeheroes/types';

interface StatItem {
  value: number;
  label: string;
  color: string;
}

@Component({
  selector: 'app-stats-grid',
  standalone: true,
  template: `
    <div class="stats-grid">
      @for (stat of statsItems(); track stat.label) {
        <div
          class="stat-card"
          [style.--stat-color]="stat.color"
          role="group"
          [attr.aria-label]="stat.value + ' ' + stat.label"
        >
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        margin: 1.5rem 0;
      }

      @media (min-width: 480px) {
        .stats-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      .stat-card {
        background: rgba(0, 0, 0, 0.6);
        border: 2px solid var(--stat-color);
        border-radius: 8px;
        padding: 1rem 0.75rem;
        text-align: center;
        transition: all 0.2s ease;
        box-shadow:
          0 0 8px var(--stat-color),
          0 0 16px color-mix(in srgb, var(--stat-color) 30%, transparent),
          inset 0 0 12px color-mix(in srgb, var(--stat-color) 5%, transparent);
      }

      .stat-card:hover {
        box-shadow:
          0 0 12px var(--stat-color),
          0 0 24px color-mix(in srgb, var(--stat-color) 40%, transparent),
          inset 0 0 16px color-mix(in srgb, var(--stat-color) 8%, transparent);
      }

      /* Touch device active state */
      @media (hover: none) {
        .stat-card:active {
          box-shadow:
            0 0 12px var(--stat-color),
            0 0 24px color-mix(in srgb, var(--stat-color) 40%, transparent),
            inset 0 0 16px color-mix(in srgb, var(--stat-color) 8%, transparent);
        }
      }

      .stat-value {
        display: block;
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--stat-color);
        text-shadow: 0 0 10px color-mix(in srgb, var(--stat-color) 50%, transparent);
        margin-bottom: 0.25rem;
      }

      .stat-label {
        display: block;
        font-size: 0.65rem;
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
export class StatsGridComponent {
  stats = input<UserStats | null>(null);

  statsItems(): StatItem[] {
    const s = this.stats();
    if (!s) {
      return [
        { value: 0, label: 'Pushes', color: 'var(--neon-cyan)' },
        { value: 0, label: 'PRs', color: 'var(--neon-purple)' },
        { value: 0, label: 'Merged', color: 'var(--neon-green)' },
        { value: 0, label: 'Reviews', color: 'var(--neon-orange)' },
      ];
    }

    return [
      { value: s.counters?.codePushes ?? 0, label: 'Pushes', color: 'var(--neon-cyan)' },
      { value: s.counters?.pullRequests?.total ?? 0, label: 'PRs', color: 'var(--neon-purple)' },
      { value: s.counters?.pullRequests?.merged ?? 0, label: 'Merged', color: 'var(--neon-green)' },
      { value: s.counters?.codeReviews ?? 0, label: 'Reviews', color: 'var(--neon-orange)' },
    ];
  }
}
