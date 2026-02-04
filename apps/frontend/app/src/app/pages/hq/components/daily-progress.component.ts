import { Component, input, computed } from '@angular/core';
import { DailyProgress } from '../../../core/services/hq-data.service';

@Component({
  selector: 'app-daily-progress',
  standalone: true,
  template: `
    <div class="daily-progress-card">
      <div class="card-header">
        <h3 class="card-title">Today's Goal</h3>
        <span class="activities-badge">{{ activitiesCount() }} activities</span>
      </div>

      <div class="progress-container">
        <!-- Circular Progress -->
        <div class="circular-progress">
          <svg class="progress-ring" viewBox="0 0 120 120">
            <circle class="progress-ring-bg" cx="60" cy="60" r="52" />
            <circle
              class="progress-ring-fill"
              cx="60"
              cy="60"
              r="52"
              [style.stroke-dashoffset]="getStrokeDashoffset()"
              [class.completed]="isGoalReached()"
            />
          </svg>
          <div class="progress-content">
            <span class="progress-percent">{{ roundedPercent() }}%</span>
          </div>
        </div>

        <!-- Stats -->
        <div class="progress-stats">
          <div class="xp-display">
            <span class="xp-current">{{ formatNumber(progress()?.xpEarned ?? 0) }}</span>
            <span class="xp-separator">of</span>
            <span class="xp-goal">{{ formatNumber(progress()?.goal ?? 0) }} XP</span>
          </div>
          <p class="motivational-text" [class.success]="isGoalReached()">
            {{ motivationalMessage() }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .daily-progress-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.25rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .card-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin: 0;
        letter-spacing: -0.02em;
      }

      .activities-badge {
        font-size: 0.6875rem;
        color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.05);
        padding: 0.2rem 0.625rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .progress-container {
        display: flex;
        align-items: center;
        gap: 1.25rem;
      }

      .circular-progress {
        position: relative;
        width: 100px;
        height: 100px;
        flex-shrink: 0;
      }

      .progress-ring {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .progress-ring-bg {
        fill: none;
        stroke: rgba(255, 255, 255, 0.1);
        stroke-width: 8;
      }

      .progress-ring-fill {
        fill: none;
        stroke: var(--neon-cyan);
        stroke-width: 8;
        stroke-linecap: round;
        stroke-dasharray: 326.73;
        transition: stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .progress-ring-fill.completed {
        stroke: var(--neon-green);
      }

      .progress-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .progress-percent {
        font-size: 1.375rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.95);
        line-height: 1;
      }

      .progress-stats {
        flex: 1;
        min-width: 0;
      }

      .xp-display {
        display: flex;
        align-items: baseline;
        gap: 0.375rem;
        flex-wrap: wrap;
        margin-bottom: 0.5rem;
      }

      .xp-current {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--neon-cyan);
        line-height: 1;
      }

      .xp-separator {
        font-size: 0.8125rem;
        color: rgba(255, 255, 255, 0.4);
      }

      .xp-goal {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.6);
      }

      .motivational-text {
        font-size: 0.8125rem;
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
        font-style: normal;
        line-height: 1.4;
      }

      .motivational-text.success {
        color: var(--neon-green);
      }

      @media (min-width: 640px) {
        .daily-progress-card {
          padding: 1.5rem;
        }

        .circular-progress {
          width: 120px;
          height: 120px;
        }

        .progress-percent {
          font-size: 1.75rem;
        }

        .xp-current {
          font-size: 2rem;
        }
      }
    `,
  ],
})
export class DailyProgressComponent {
  progress = input<DailyProgress | null>(null);
  readonly Math = Math;

  progressPercent = computed(() => {
    const p = this.progress();
    if (!p || !p.goal) return 0;
    return Math.min(100, (p.xpEarned / p.goal) * 100);
  });

  roundedPercent = computed(() => Math.round(this.progressPercent()));

  getStrokeDashoffset = computed(() => {
    const circumference = 2 * Math.PI * 52;
    const percent = this.progressPercent();
    return circumference - (percent / 100) * circumference;
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

    if (percent >= 100) return '🎉 Daily goal achieved!';
    if (percent >= 75) return `Almost there! ${remaining} XP to go`;
    if (percent >= 50) return `Halfway! ${remaining} XP remaining`;
    if (percent >= 25) return `Keep it up! ${remaining} XP to your goal`;
    if (percent > 0) return `Great start! ${remaining} XP to reach your goal`;
    return 'Ready to start your day?';
  });

  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}
