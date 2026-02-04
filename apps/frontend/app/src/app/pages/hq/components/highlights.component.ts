import { Component, input } from '@angular/core';
import { Highlight } from '../../../core/services/hq-data.service';

@Component({
  selector: 'app-highlights',
  standalone: true,
  template: `
    <div class="highlights-section">
      <h3 class="section-title">
        <span class="title-icon">⚡</span>
        Recent Activity
      </h3>

      @if (highlights().length === 0) {
        <div class="empty-state">
          <p>No recent highlights</p>
          <span>Start coding to see your achievements!</span>
        </div>
      } @else {
        <div class="highlights-list">
          @for (highlight of highlights(); track highlight.id) {
            <div class="highlight-card">
              <div class="highlight-icon-badge">
                {{ getIconEmoji(highlight.icon) }}
              </div>
              <div class="highlight-body">
                <p class="highlight-text">{{ highlight.message || 'Activity recorded' }}</p>
                <span class="highlight-timestamp">{{ formatTime(highlight.timestamp) }}</span>
              </div>
              @if (highlight.xp) {
                <div class="xp-tag">
                  <span>+{{ highlight.xp }}</span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .highlights-section {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.25rem;
        margin: 1.25rem 0;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .section-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin: 0 0 0.875rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        letter-spacing: -0.02em;
      }

      .title-icon {
        font-size: 1.125rem;
      }

      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: rgba(255, 255, 255, 0.5);
      }

      .empty-state p {
        font-size: 1rem;
        margin: 0 0 0.5rem 0;
        font-weight: 500;
      }

      .empty-state span {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.35);
      }

      .highlights-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .highlight-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        transition: all 0.2s;
      }

      .highlight-card:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .highlight-icon-badge {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        font-size: 1rem;
        flex-shrink: 0;
      }

      .highlight-body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .highlight-text {
        font-size: 0.8125rem;
        color: rgba(255, 255, 255, 0.85);
        margin: 0;
        line-height: 1.4;
      }

      .highlight-timestamp {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
      }

      .xp-tag {
        background: color-mix(in srgb, var(--neon-green) 15%, transparent);
        border: 1px solid color-mix(in srgb, var(--neon-green) 30%, transparent);
        border-radius: 6px;
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--neon-green);
        white-space: nowrap;
      }
    `,
  ],
})
export class HighlightsComponent {
  highlights = input<Highlight[]>([]);

  getIconEmoji(icon: string): string {
    const iconMap: Record<string, string> = {
      upload: '🚀', // rocket
      'git-pull-request': '📋', // clipboard
      'git-merge': '🔗', // link
      'x-circle': '❌', // cross
      eye: '👁', // eye
      'alert-circle': '🔴', // red circle
      'check-circle': '✅', // check mark
      activity: '⚡', // lightning
    };
    return iconMap[icon] ?? '⚡';
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
