import { Component, Input, inject, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BadgeRarity } from '@codeheroes/types';
import {
  UserBadge,
  getBadgeRarity,
  getBadgeEmoji,
  getBadgeRarityColor,
} from '../../../core/models/user-badge.model';

interface BadgeDisplay {
  badge: UserBadge;
  emoji: string;
  rarity: BadgeRarity;
  color: string;
}

@Component({
  selector: 'app-badges-grid',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="badges-section" aria-labelledby="badges-heading">
      <div class="section-header">
        <h3 id="badges-heading" class="section-title">Badges</h3>
        <span class="badge-count" [attr.aria-label]="badges.length + ' badges earned'">
          {{ badges.length }}
        </span>
      </div>

      @if (badgeDisplays.length > 0) {
        <div class="badges-grid" role="list">
          @for (item of badgeDisplays; track item.badge.id) {
            <div
              class="badge-card"
              [class.legendary]="item.rarity === 'LEGENDARY'"
              [style.--badge-color]="item.color"
              role="listitem"
              [attr.aria-label]="item.badge.name + ', ' + item.rarity.toLowerCase() + ' badge'"
            >
              <span class="badge-emoji" aria-hidden="true">{{ item.emoji }}</span>
              <span class="badge-name">{{ item.badge.name }}</span>
              @if (item.badge.earnedAt) {
                <span class="badge-date">{{ item.badge.earnedAt | date:'MMM yyyy' }}</span>
              }
              @if (item.badge.xp) {
                <span class="badge-xp">+{{ item.badge.xp }} XP</span>
              }
            </div>
          }
        </div>
      } @else {
        <div class="empty-state" role="status">
          <span class="empty-emoji" aria-hidden="true">🎯</span>
          <p class="empty-text">No badges yet</p>
          <p class="empty-hint">Keep coding to earn your first badge!</p>
        </div>
      }
    </section>
  `,
  styles: [`
    .badges-section {
      margin-top: 2rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .section-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-family: monospace;
      color: var(--neon-cyan);
      margin: 0;
    }

    .badge-count {
      font-size: 0.875rem;
      font-family: monospace;
      color: rgba(255, 255, 255, 0.5);
      background: rgba(0, 0, 0, 0.4);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .badges-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    @media (min-width: 480px) {
      .badges-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .badge-card {
      background: rgba(0, 0, 0, 0.6);
      border: 2px solid var(--badge-color);
      border-radius: 8px;
      padding: 1rem 0.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.2s ease;
      box-shadow:
        0 0 8px var(--badge-color),
        0 0 16px color-mix(in srgb, var(--badge-color) 30%, transparent),
        inset 0 0 12px color-mix(in srgb, var(--badge-color) 5%, transparent);
    }

    .badge-card:hover {
      box-shadow:
        0 0 12px var(--badge-color),
        0 0 24px color-mix(in srgb, var(--badge-color) 40%, transparent),
        inset 0 0 16px color-mix(in srgb, var(--badge-color) 8%, transparent);
    }

    .badge-card.legendary {
      animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%, 100% {
        box-shadow:
          0 0 8px var(--badge-color),
          0 0 16px color-mix(in srgb, var(--badge-color) 30%, transparent),
          inset 0 0 12px color-mix(in srgb, var(--badge-color) 5%, transparent);
      }
      50% {
        box-shadow:
          0 0 16px var(--badge-color),
          0 0 32px color-mix(in srgb, var(--badge-color) 50%, transparent),
          inset 0 0 20px color-mix(in srgb, var(--badge-color) 10%, transparent);
      }
    }

    /* Touch device active state */
    @media (hover: none) {
      .badge-card:active {
        box-shadow:
          0 0 12px var(--badge-color),
          0 0 24px color-mix(in srgb, var(--badge-color) 40%, transparent),
          inset 0 0 16px color-mix(in srgb, var(--badge-color) 8%, transparent);
      }
    }

    .badge-emoji {
      font-size: 2rem;
      line-height: 1;
    }

    .badge-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      line-height: 1.2;
    }

    .badge-date {
      font-size: 0.625rem;
      color: rgba(255, 255, 255, 0.4);
      font-family: monospace;
    }

    .badge-xp {
      font-size: 0.625rem;
      color: var(--badge-color);
      font-family: monospace;
      font-weight: 600;
      text-shadow: 0 0 8px color-mix(in srgb, var(--badge-color) 50%, transparent);
    }

    .empty-state {
      text-align: center;
      padding: 2rem 1rem;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      border: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .empty-emoji {
      font-size: 2.5rem;
      display: block;
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
      font-family: monospace;
      margin: 0;
    }
  `],
})
export class BadgesGridComponent {
  readonly #cdr = inject(ChangeDetectorRef);
  private _badges: UserBadge[] = [];

  @Input()
  set badges(value: UserBadge[]) {
    this._badges = value;
    // Mark for check when badges are updated asynchronously
    // Using markForCheck() instead of detectChanges() to avoid potential
    // ExpressionChangedAfterItHasBeenCheckedError and re-entrant change detection
    this.#cdr.markForCheck();
  }

  get badges(): UserBadge[] {
    return this._badges;
  }

  get badgeDisplays(): BadgeDisplay[] {
    return this._badges.map((badge) => {
      const rarity = getBadgeRarity(badge);
      return {
        badge,
        emoji: getBadgeEmoji(badge),
        rarity,
        color: getBadgeRarityColor(rarity),
      };
    });
  }
}
