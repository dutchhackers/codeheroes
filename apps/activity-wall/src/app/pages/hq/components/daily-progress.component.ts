import { Component, input, computed } from '@angular/core';
import { DailyProgress } from '../../../core/services/hq-data.service';

@Component({
  selector: 'app-daily-progress',
  standalone: true,
  template: `
    <div class="daily-progress card-glow-cyan">
      <div class="header">
        <span class="title">TODAY'S PROGRESS</span>
        <span class="activities-count" [attr.aria-label]="activitiesCount() + ' activities today'">
          {{ activitiesCount() }} activities
        </span>
      </div>

      <div
        class="progress-bar-container"
        role="progressbar"
        [attr.aria-valuenow]="progressPercent()"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="'Daily progress: ' + progressPercent() + ' percent'"
      >
        <div
          class="progress-bar"
          [style.width.%]="progressPercent()"
          [class.goal-reached]="isGoalReached()"
        ></div>
      </div>

      <div class="stats-row">
        <span class="xp-earned">{{ formatNumber(progress()?.xpEarned ?? 0) }}</span>
        <span class="divider">/</span>
        <span class="xp-goal">{{ formatNumber(progress()?.goal ?? 0) }} XP</span>
      </div>

      <div class="motivational-message" [class.success]="isGoalReached()">
        {{ motivationalMessage() }}
      </div>
    </div>
  `,
  styles: [`
    .daily-progress {
      background: rgba(0, 0, 0, 0.6);
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

    .xp-goal {
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
  `],
})
export class DailyProgressComponent {
  progress = input<DailyProgress | null>(null);

  progressPercent = computed(() => {
    const p = this.progress();
    if (!p || !p.goal) return 0;
    return Math.min(100, (p.xpEarned / p.goal) * 100);
  });

  activitiesCount = computed(() => this.progress()?.activitiesCount ?? 0);

  isGoalReached = computed(() => {
    const p = this.progress();
    return p ? p.xpEarned >= p.goal : false;
  });

  motivationalMessage = computed(() => {
    const p = this.progress();
    if (!p) return 'Start your day strong!';

    const remaining = p.goal - p.xpEarned;
    const percent = this.progressPercent();

    if (percent >= 100) return 'Daily goal crushed!';
    if (percent >= 75) return `Almost there! Just ${remaining} XP to go`;
    if (percent >= 50) return `Halfway there! ${remaining} XP remaining`;
    if (percent >= 25) return `Great start! ${remaining} XP to reach your goal`;
    if (percent > 0) return `Keep pushing! ${remaining} XP to your goal`;
    return 'Start your day strong!';
  });

  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}
