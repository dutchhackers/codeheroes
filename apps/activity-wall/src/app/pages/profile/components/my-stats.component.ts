import { Component, computed, input } from '@angular/core';
import { WeeklyStatsRecord } from '../../../core/services/user-stats.service';

@Component({
  selector: 'app-my-stats',
  standalone: true,
  template: `
    <div class="my-stats-card">
      <h3 class="section-title">WEEKLY TRENDS</h3>
      <p class="subsection-title">LAST 4 WEEKS</p>
      <div class="stats-grid">
        <div class="stat-item" style="--stat-color: var(--neon-purple)">
          <span class="stat-value">{{ fourWeekAverages().prsPerWeek }}</span>
          <span class="stat-label">PRs/Week</span>
        </div>
        <div class="stat-item" style="--stat-color: var(--neon-orange)">
          <span class="stat-value">{{ fourWeekAverages().reviewsPerWeek }}</span>
          <span class="stat-label">Reviews/Week</span>
        </div>
        <div class="stat-item" style="--stat-color: var(--neon-cyan)">
          <span class="stat-value">{{ formatXp(fourWeekAverages().xpPerWeek) }}</span>
          <span class="stat-label">XP/Week</span>
        </div>
        <div class="stat-item" style="--stat-color: var(--neon-green)">
          <span class="stat-value">{{ fourWeekAverages().pushesPerWeek }}</span>
          <span class="stat-label">Pushes/Week</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-stats-card {
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.25rem;
      margin-top: 1.5rem;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 0.5rem 0;
    }

    .subsection-title {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.4);
      margin: 0 0 0.75rem 0;
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

    .stat-item {
      text-align: center;
      padding: 0.75rem 0.5rem;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--stat-color) 30%, transparent);
    }

    .stat-value {
      display: block;
      font-size: 1.25rem;
      font-weight: bold;
      color: var(--stat-color);
      text-shadow: 0 0 10px color-mix(in srgb, var(--stat-color) 50%, transparent);
      margin-bottom: 0.25rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .stat-label {
      display: block;
      font-size: 0.6rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    @media (min-width: 768px) {
      .stat-value {
        font-size: 1.5rem;
      }

      .stat-label {
        font-size: 0.65rem;
      }
    }
  `],
})
export class MyStatsComponent {
  weeklyHistory = input<WeeklyStatsRecord[]>([]);

  fourWeekAverages = computed(() => {
    const history = this.weeklyHistory();
    const weeksWithData = history.filter(w => w.data);
    const weekCount = weeksWithData.length || 1; // Avoid division by zero

    let totalPrs = 0;
    let totalReviews = 0;
    let totalXp = 0;
    let totalPushes = 0;

    for (const week of weeksWithData) {
      const data = week.data as Record<string, unknown> | undefined;
      if (!data) continue;

      const counters = data['counters'] as Record<string, unknown> | undefined;
      const actions = counters?.['actions'] as Record<string, number> | undefined;

      totalPrs += actions?.['pull_request_create'] ?? 0;
      totalReviews += actions?.['code_review_submit'] ?? 0;
      totalXp += (data['xpEarned'] as number) ?? 0;
      totalPushes += actions?.['code_push'] ?? 0;
    }

    return {
      prsPerWeek: this.formatAverage(totalPrs / weekCount),
      reviewsPerWeek: this.formatAverage(totalReviews / weekCount),
      xpPerWeek: Math.round(totalXp / weekCount),
      pushesPerWeek: this.formatAverage(totalPushes / weekCount),
    };
  });

  private formatAverage(value: number): string {
    if (value === 0) return '0';
    if (value < 1) return value.toFixed(1);
    if (value >= 10) return Math.round(value).toString();
    return value.toFixed(1);
  }

  formatXp(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(value >= 10000 ? 0 : 1) + 'K';
    }
    return value.toLocaleString();
  }
}
