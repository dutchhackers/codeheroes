import { Component, input } from '@angular/core';
import { Highlight } from '../../../core/services/hq-data.service';

@Component({
  selector: 'app-highlights',
  standalone: true,
  template: `
    <div class="highlights-container card-glow-purple">
      <h3 class="section-title">
        <span class="icon">⚡</span>
        RECENT HIGHLIGHTS
      </h3>

      @if (highlights().length === 0) {
        <div class="empty-state">
          No recent activity. Time to code!
        </div>
      } @else {
        <div class="highlights-list">
          @for (highlight of highlights(); track highlight.id) {
            <div class="highlight-item">
              <div class="highlight-icon">
                {{ getIconEmoji(highlight.icon) }}
              </div>
              <div class="highlight-content">
                <span class="highlight-message">{{ highlight.message }}</span>
                @if (highlight.xp) {
                  <span class="highlight-xp">(+{{ highlight.xp }} XP)</span>
                }
              </div>
              <span class="highlight-time">{{ formatTime(highlight.timestamp) }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .highlights-container {
      background: rgba(0, 0, 0, 0.6);
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }

    .section-title {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .icon {
      font-size: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 1.5rem;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.85rem;
    }

    .highlights-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .highlight-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .highlight-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .highlight-icon {
      font-size: 1.1rem;
      line-height: 1;
      flex-shrink: 0;
      width: 1.5rem;
      text-align: center;
    }

    .highlight-content {
      flex: 1;
      min-width: 0;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.4;
    }

    .highlight-message {
      display: inline;
    }

    .highlight-xp {
      color: var(--neon-green);
      font-weight: 600;
      margin-left: 0.25rem;
      white-space: nowrap;
    }

    .highlight-time {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.3);
      white-space: nowrap;
      flex-shrink: 0;
    }
  `],
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
