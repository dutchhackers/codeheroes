import { Component, input } from '@angular/core';
import { WeeklyStats } from '../../../core/services/hq-data.service';

interface StatItem {
  value: number | string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-weekly-stats',
  standalone: true,
  template: `
    <div class="weekly-stats-container">
      <h3 class="section-title">THIS WEEK</h3>
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
    </div>
  `,
  styles: [`
    .weekly-stats-container {
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
    }

    .stat-card:hover {
      box-shadow:
        0 0 12px var(--stat-color),
        0 0 24px color-mix(in srgb, var(--stat-color) 40%, transparent),
        inset 0 0 16px color-mix(in srgb, var(--stat-color) 8%, transparent);
    }

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
  `],
})
export class WeeklyStatsComponent {
  stats = input<WeeklyStats | null>(null);

  statsItems(): StatItem[] {
    const s = this.stats();
    if (!s) {
      return [
        { value: '0', label: 'XP', color: 'var(--neon-cyan)' },
        { value: 0, label: 'PRs', color: 'var(--neon-purple)' },
        { value: 0, label: 'Merged', color: 'var(--neon-green)' },
        { value: 0, label: 'Reviews', color: 'var(--neon-orange)' },
      ];
    }

    return [
      { value: this.formatXp(s.xpGained), label: 'XP', color: 'var(--neon-cyan)' },
      { value: s.prsCreated, label: 'PRs', color: 'var(--neon-purple)' },
      { value: s.prsMerged, label: 'Merged', color: 'var(--neon-green)' },
      { value: s.reviewsSubmitted, label: 'Reviews', color: 'var(--neon-orange)' },
    ];
  }

  formatXp(xp: number): string {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  }
}
