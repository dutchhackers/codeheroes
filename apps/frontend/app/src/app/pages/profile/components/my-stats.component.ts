import { Component, computed, input } from '@angular/core';
import { WeeklyStatsRecord } from '../../../core/services/user-stats.service';

@Component({
  selector: 'app-my-stats',
  standalone: true,
  template: `
    <div class="weekly-trends-card">
      <h3 class="section-title">Weekly Trends</h3>
      <p class="subtitle">Last 4 weeks average</p>
      <div class="stats-grid">
        <div class="trend-item">
          <div class="trend-icon" style="background: color-mix(in srgb, var(--neon-purple) 15%, transparent)">
            <span style="color: var(--neon-purple)">🔀</span>
          </div>
          <div class="trend-content">
            <span class="trend-value">{{ fourWeekAverages().prsPerWeek }}</span>
            <span class="trend-label">PRs/Week</span>
          </div>
        </div>
        <div class="trend-item">
          <div class="trend-icon" style="background: color-mix(in srgb, var(--neon-orange) 15%, transparent)">
            <span style="color: var(--neon-orange)">👁️</span>
          </div>
          <div class="trend-content">
            <span class="trend-value">{{ fourWeekAverages().reviewsPerWeek }}</span>
            <span class="trend-label">Reviews/Week</span>
          </div>
        </div>
        <div class="trend-item">
          <div class="trend-icon" style="background: color-mix(in srgb, var(--neon-cyan) 15%, transparent)">
            <span style="color: var(--neon-cyan)">⚡</span>
          </div>
          <div class="trend-content">
            <span class="trend-value">{{ formatXp(fourWeekAverages().xpPerWeek) }}</span>
            <span class="trend-label">XP/Week</span>
          </div>
        </div>
        <div class="trend-item">
          <div class="trend-icon" style="background: color-mix(in srgb, var(--neon-green) 15%, transparent)">
            <span style="color: var(--neon-green)">📤</span>
          </div>
          <div class="trend-content">
            <span class="trend-value">{{ fourWeekAverages().pushesPerWeek }}</span>
            <span class="trend-label">Pushes/Week</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .weekly-trends-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.5rem;
        margin: 2rem 0;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin: 0 0 0.25rem 0;
        letter-spacing: -0.02em;
      }

      .subtitle {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.5);
        margin: 0 0 1.25rem 0;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      @media (min-width: 640px) {
        .stats-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      .trend-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        transition: all 0.2s;
      }

      .trend-item:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .trend-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      .trend-content {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-width: 0;
        flex: 1;
        overflow: hidden;
      }

      .trend-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.95);
        line-height: 1;
      }

      .trend-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        overflow-wrap: break-word;
        line-height: 1.2;
      }

      @media (min-width: 768px) {
        .trend-value {
          font-size: 1.5rem;
        }

        .trend-label {
          font-size: 0.8rem;
        }
      }
    `,
  ],
})
export class MyStatsComponent {
  weeklyHistory = input<WeeklyStatsRecord[]>([]);

  fourWeekAverages = computed(() => {
    const history = this.weeklyHistory();
    const weeksWithData = history.filter((w) => w.data);

    // Return zeros when no data available
    if (weeksWithData.length === 0) {
      return {
        prsPerWeek: '0',
        reviewsPerWeek: '0',
        xpPerWeek: 0,
        pushesPerWeek: '0',
      };
    }

    const weekCount = weeksWithData.length;
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
