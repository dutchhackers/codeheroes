import { Component, input, computed } from '@angular/core';
import { DailyProgress, WeeklyStats } from '../../../core/services/hq-data.service';

export type PeriodType = 'day' | 'week';

@Component({
  selector: 'app-period-progress',
  standalone: true,
  template: `
    <div class="period-progress card-glow-cyan">
      <div class="header">
        <span class="title">{{ periodTitle() }}</span>
        <span class="activities-count" [attr.aria-label]="activitiesLabel()">
          {{ activitiesDisplay() }}
        </span>
      </div>

      <div
        class="progress-bar-container"
        role="progressbar"
        [attr.aria-valuenow]="progressPercent()"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="'Progress: ' + progressPercent() + ' percent'"
      >
        <div class="progress-bar" [style.width.%]="progressPercent()" [class.goal-reached]="isGoalReached()"></div>
      </div>

      <div class="stats-row">
        <span class="xp-earned">{{ formatNumber(xpEarned()) }}</span>
        @if (period() === 'day') {
          <span class="divider">/</span>
          <span class="xp-goal">{{ formatNumber(goal()) }} XP</span>
        } @else {
          <span class="xp-label">XP</span>
        }
      </div>

      <div class="motivational-message" [class.success]="isGoalReached()">
        {{ motivationalMessage() }}
      </div>
    </div>
  `,
  styles: [
    `
      .period-progress {
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        border-radius: 8px;
        padding: 1rem;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .title {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 600;
      }

      .activities-count {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.4);
        font-family: 'JetBrains Mono', monospace;
      }

      .progress-bar-container {
        height: 12px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        overflow: hidden;
        position: relative;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--neon-cyan), var(--neon-purple));
        border-radius: 6px;
        transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        will-change: width;
        box-shadow: 0 0 12px var(--neon-cyan);
        position: relative;
      }

      .progress-bar.goal-reached {
        background: linear-gradient(90deg, var(--neon-green), var(--neon-cyan));
        box-shadow: 0 0 16px var(--neon-green);
      }

      .progress-bar::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 50%;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent);
        border-radius: 6px 6px 0 0;
      }

      .stats-row {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-top: 0.75rem;
        font-size: 0.9rem;
      }

      .xp-earned {
        color: var(--neon-cyan);
        font-weight: bold;
        text-shadow: 0 0 10px color-mix(in srgb, var(--neon-cyan) 50%, transparent);
      }

      .divider {
        color: rgba(255, 255, 255, 0.3);
      }

      .xp-goal,
      .xp-label {
        color: rgba(255, 255, 255, 0.6);
      }

      .motivational-message {
        margin-top: 0.5rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
      }

      .motivational-message.success {
        color: var(--neon-green);
        text-shadow: 0 0 8px color-mix(in srgb, var(--neon-green) 30%, transparent);
      }
    `,
  ],
})
export class PeriodProgressComponent {
  period = input<PeriodType>('day');
  dailyProgress = input<DailyProgress | null>(null);
  weeklyStats = input<WeeklyStats | null>(null);

  periodTitle = computed(() => {
    return this.period() === 'day' ? "TODAY'S PROGRESS" : "THIS WEEK'S PROGRESS";
  });

  xpEarned = computed(() => {
    if (this.period() === 'day') {
      return this.dailyProgress()?.xpEarned ?? 0;
    } else {
      return this.weeklyStats()?.xpGained ?? 0;
    }
  });

  goal = computed(() => this.dailyProgress()?.goal ?? 8000);

  progressPercent = computed(() => {
    if (this.period() === 'day') {
      const p = this.dailyProgress();
      if (!p || !p.goal) return 0;
      return Math.min(100, (p.xpEarned / p.goal) * 100);
    } else {
      // For weekly, show progress towards 7x daily goal
      const weeklyGoal = 7 * this.goal();
      const xp = this.weeklyStats()?.xpGained ?? 0;
      return Math.min(100, (xp / weeklyGoal) * 100);
    }
  });

  activitiesDisplay = computed(() => {
    if (this.period() === 'day') {
      const count = this.dailyProgress()?.activitiesCount ?? 0;
      return `${count} activities`;
    } else {
      const stats = this.weeklyStats();
      if (!stats) return '0 activities';
      const total = stats.prsCreated + stats.prsMerged + stats.reviewsSubmitted + stats.codePushes;
      return `${total} activities`;
    }
  });

  activitiesLabel = computed(() => {
    const display = this.activitiesDisplay();
    return `${display} ${this.period() === 'day' ? 'today' : 'this week'}`;
  });

  isGoalReached = computed(() => {
    return this.progressPercent() >= 100;
  });

  motivationalMessage = computed(() => {
    const percent = this.progressPercent();
    const period = this.period();

    if (percent >= 100) {
      return period === 'day' ? 'Daily goal crushed! 🔥' : 'Amazing week! Keep it up! 🚀';
    }
    if (percent >= 75) {
      return period === 'day' ? 'Almost there! Keep pushing!' : 'Crushing it this week!';
    }
    if (percent >= 50) {
      return 'Halfway there! Nice progress!';
    }
    if (percent >= 25) {
      return 'Great start! Keep going!';
    }
    if (percent > 0) {
      return 'Off to a good start!';
    }
    return period === 'day' ? 'Start your day strong!' : 'Make this week count!';
  });

  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}
