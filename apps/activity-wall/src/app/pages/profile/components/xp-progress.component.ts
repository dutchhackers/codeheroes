import { Component, input, computed } from '@angular/core';
import { UserStats } from '@codeheroes/types';

@Component({
  selector: 'app-xp-progress',
  standalone: true,
  template: `
    <div class="xp-container card-glow-cyan">
      <div class="xp-header">
        <span class="xp-label">XP</span>
        <span class="xp-total">{{ formatNumber(stats()?.xp ?? 0) }}</span>
      </div>
      <div class="progress-bar-container">
        <div
          class="progress-bar"
          [style.width.%]="progressPercent()"
        ></div>
      </div>
      <div class="xp-footer">
        <span class="xp-current">{{ stats()?.currentLevelXp ?? 0 }}</span>
        <span class="xp-divider">/</span>
        <span class="xp-needed">{{ stats()?.xpToNextLevel ?? 0 }}</span>
        <span class="xp-suffix">to Level {{ (stats()?.level ?? 0) + 1 }}</span>
      </div>
    </div>
  `,
  styles: [`
    .xp-container {
      background: rgba(0, 0, 0, 0.6);
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }

    .xp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .xp-label {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .xp-total {
      font-size: 1.25rem;
      font-weight: bold;
      color: var(--neon-cyan, #00f5ff);
      text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
    }

    .progress-bar-container {
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--neon-cyan, #00f5ff), var(--neon-purple, #bf00ff));
      border-radius: 4px;
      transition: width 0.5s ease;
      box-shadow: 0 0 10px var(--neon-cyan, #00f5ff);
    }

    .xp-footer {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .xp-current {
      color: var(--neon-cyan, #00f5ff);
    }

    .xp-divider {
      color: rgba(255, 255, 255, 0.3);
    }

    .xp-needed {
      color: rgba(255, 255, 255, 0.7);
    }

    .xp-suffix {
      margin-left: 0.5rem;
      color: rgba(255, 255, 255, 0.4);
    }
  `],
})
export class XpProgressComponent {
  stats = input<UserStats | null>(null);

  progressPercent = computed(() => {
    const s = this.stats();
    if (!s || !s.xpToNextLevel) return 0;
    return Math.min(100, (s.currentLevelXp / s.xpToNextLevel) * 100);
  });

  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}
