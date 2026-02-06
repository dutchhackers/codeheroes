import { Component, input, computed } from '@angular/core';
import { UserStats } from '@codeheroes/types';

@Component({
  selector: 'app-xp-progress',
  standalone: true,
  template: `
    <div class="xp-progress-card">
      <div class="xp-header">
        <div class="xp-info">
          <span class="xp-label">Total Experience</span>
          <span class="xp-total">{{ formatNumber(stats()?.xp ?? 0) }} XP</span>
        </div>
        <div class="level-badge">
          <span class="level-label">Level</span>
          <span class="level-number">{{ stats()?.level ?? 1 }}</span>
        </div>
      </div>
      <div class="progress-section">
        <div
          class="progress-bar-container"
          role="progressbar"
          [attr.aria-valuenow]="progressPercent()"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-label]="'Level progress: ' + progressPercent().toFixed(0) + ' percent to level ' + ((stats()?.level ?? 0) + 1)"
        >
          <div class="progress-bar" [style.width.%]="progressPercent()"></div>
        </div>
        <div class="progress-info">
          <span class="progress-text">{{ formatNumber(stats()?.currentLevelXp ?? 0) }} / {{ formatNumber(levelXpSpan()) }} XP</span>
          <span class="next-level-text">{{ formatNumber(stats()?.xpToNextLevel ?? 0) }} to Level {{ (stats()?.level ?? 0) + 1 }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .xp-progress-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.5rem;
        margin: 1.5rem 0;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .xp-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .xp-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .xp-label {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
      }

      .xp-total {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--neon-cyan);
        line-height: 1;
      }

      .level-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        background: color-mix(in srgb, var(--neon-purple) 15%, transparent);
        border: 1px solid color-mix(in srgb, var(--neon-purple) 30%, transparent);
        border-radius: 12px;
        padding: 0.5rem 1rem;
      }

      .level-label {
        font-size: 0.625rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .level-number {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--neon-purple);
        line-height: 1;
      }

      .progress-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .progress-bar-container {
        height: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        overflow: hidden;
        position: relative;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--neon-cyan), var(--neon-purple));
        border-radius: 8px;
        transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 0 12px var(--neon-cyan);
        position: relative;
      }

      .progress-bar::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 50%;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
        border-radius: 8px 8px 0 0;
      }

      .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
      }

      .progress-text {
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
      }

      .next-level-text {
        color: rgba(255, 255, 255, 0.5);
      }
    `,
  ],
})
export class XpProgressComponent {
  stats = input<UserStats | null>(null);

  levelXpSpan = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    return (s.currentLevelXp ?? 0) + (s.xpToNextLevel ?? 0);
  });

  progressPercent = computed(() => {
    const s = this.stats();
    const span = this.levelXpSpan();
    if (!s || !span) return 0;
    return Math.min(100, ((s.currentLevelXp ?? 0) / span) * 100);
  });

  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}
