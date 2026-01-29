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
        <div class="stat-card" [style.--stat-color]="stat.color">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
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
      border: 1px solid color-mix(in srgb, var(--stat-color) 40%, transparent);
      border-radius: 8px;
      padding: 1rem 0.75rem;
      text-align: center;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      border-color: var(--stat-color);
      box-shadow: 0 0 15px color-mix(in srgb, var(--stat-color) 30%, transparent);
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
  `],
})
export class StatsGridComponent {
  stats = input<UserStats | null>(null);

  statsItems(): StatItem[] {
    const s = this.stats();
    if (!s) {
      return [
        { value: 0, label: 'Pushes', color: '#00f5ff' },
        { value: 0, label: 'PRs', color: '#bf00ff' },
        { value: 0, label: 'Merged', color: '#00ff88' },
        { value: 0, label: 'Reviews', color: '#ff6600' },
      ];
    }

    return [
      { value: s.counters?.codePushes ?? 0, label: 'Pushes', color: '#00f5ff' },
      { value: s.counters?.pullRequests?.total ?? 0, label: 'PRs', color: '#bf00ff' },
      { value: s.counters?.pullRequests?.merged ?? 0, label: 'Merged', color: '#00ff88' },
      { value: s.counters?.codeReviews ?? 0, label: 'Reviews', color: '#ff6600' },
    ];
  }
}
