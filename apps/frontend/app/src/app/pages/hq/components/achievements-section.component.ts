import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserBadge, getBadgeRarity, getBadgeEmoji, getBadgeRarityColor } from '../../../core/models/user-badge.model';

interface BadgeDisplay {
  badge: UserBadge;
  emoji: string;
  color: string;
}

@Component({
  selector: 'app-achievements-section',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="achievements-container card-glow-orange">
      <h3 class="section-title">
        <span class="trophy">🏆</span>
        RECENT ACHIEVEMENTS
      </h3>

      @if (recentBadges().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">🎯</span>
          <p class="empty-text">No badges earned yet</p>
          <p class="empty-hint">Keep coding to unlock achievements!</p>
        </div>
      } @else {
        <div class="badges-list">
          @for (item of recentBadges(); track item.badge.id) {
            <div
              class="badge-item"
              [style.--badge-color]="item.color"
              [attr.aria-label]="item.badge.name + ' badge earned'"
            >
              <span class="badge-emoji">{{ item.emoji }}</span>
              <div class="badge-info">
                <span class="badge-name">{{ item.badge.name }}</span>
                @if (item.badge.description) {
                  <span class="badge-description">{{ item.badge.description }}</span>
                }
                @if (item.badge.earnedAt) {
                  <span class="badge-date">Earned {{ item.badge.earnedAt | date: 'MMM d' }}</span>
                }
              </div>
              @if (item.badge.xp) {
                <span class="badge-xp">+{{ item.badge.xp }} XP</span>
              }
            </div>
          }
        </div>

        @if (totalBadgesCount() > recentBadges().length) {
          <div class="view-all">
            <span class="view-all-text">
              +{{ totalBadgesCount() - recentBadges().length }} more badges
            </span>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .achievements-container {
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
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

      .trophy {
        font-size: 1rem;
      }

      .empty-state {
        text-align: center;
        padding: 2rem 1rem;
      }

      .empty-icon {
        display: block;
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
      }

      .empty-text {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.5);
        margin: 0 0 0.25rem;
      }

      .empty-hint {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.3);
        margin: 0;
      }

      .badges-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .badge-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--badge-color);
        border-radius: 8px;
        transition: all 0.2s ease;
        box-shadow:
          0 0 8px color-mix(in srgb, var(--badge-color) 30%, transparent),
          inset 0 0 12px color-mix(in srgb, var(--badge-color) 5%, transparent);
      }

      .badge-item:hover {
        background: rgba(255, 255, 255, 0.06);
        box-shadow:
          0 0 12px color-mix(in srgb, var(--badge-color) 40%, transparent),
          inset 0 0 16px color-mix(in srgb, var(--badge-color) 8%, transparent);
      }

      .badge-emoji {
        font-size: 2rem;
        line-height: 1;
        flex-shrink: 0;
      }

      .badge-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .badge-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .badge-description {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        line-height: 1.3;
      }

      .badge-date {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.3);
        font-family: monospace;
      }

      .badge-xp {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--badge-color);
        text-shadow: 0 0 10px color-mix(in srgb, var(--badge-color) 50%, transparent);
        white-space: nowrap;
        flex-shrink: 0;
      }

      .view-all {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        text-align: center;
      }

      .view-all-text {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
        font-family: monospace;
      }

      @media (max-width: 480px) {
        .badge-emoji {
          font-size: 1.5rem;
        }

        .badge-name {
          font-size: 0.8rem;
        }

        .badge-description {
          font-size: 0.7rem;
        }
      }
    `,
  ],
})
export class AchievementsSectionComponent {
  badges = input<UserBadge[]>([]);
  maxDisplay = input<number>(3);

  recentBadges(): BadgeDisplay[] {
    const allBadges = this.badges();
    
    // Sort by earnedAt (most recent first) and take maxDisplay
    const sortedBadges = [...allBadges].sort((a, b) => {
      if (!a.earnedAt) return 1;
      if (!b.earnedAt) return -1;
      return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
    });

    return sortedBadges.slice(0, this.maxDisplay()).map((badge) => {
      const rarity = getBadgeRarity(badge);
      return {
        badge,
        emoji: getBadgeEmoji(badge),
        color: getBadgeRarityColor(rarity),
      };
    });
  }

  totalBadgesCount(): number {
    return this.badges().length;
  }
}
