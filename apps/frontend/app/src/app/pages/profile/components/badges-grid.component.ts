import { Component, Input, inject, output, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BadgeRarity } from '@codeheroes/types';
import { UserBadge, getBadgeRarity, getBadgeEmoji, getBadgeRarityColor } from '../../../core/models/user-badge.model';

interface BadgeDisplay {
  badge: UserBadge;
  emoji: string;
  rarity: BadgeRarity;
  color: string;
}

const VISIBLE_BADGES_COUNT = 5;

@Component({
  selector: 'app-badges-grid',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
          @for (item of visibleBadges; track item.badge.id) {
            <button
              type="button"
              class="badge-card"
              [class.legendary]="item.rarity === 'LEGENDARY'"
              [style.--badge-color]="item.color"
              role="listitem"
              (click)="onBadgeClick(item.badge)"
              [attr.aria-label]="item.badge.name + ', ' + item.rarity.toLowerCase() + ' badge. Press for details'"
            >
              <span class="badge-emoji" aria-hidden="true">{{ item.emoji }}</span>
              <span class="badge-name">{{ item.badge.name }}</span>
              @if (item.badge.earnedAt) {
                <span class="badge-date">{{ item.badge.earnedAt | date: 'MMM yyyy' }}</span>
              }
              @if (item.badge.xp) {
                <span class="badge-xp">+{{ item.badge.xp }} XP</span>
              }
            </button>
          }

          @if (hiddenCount > 0) {
            <button
              class="badge-card more-card"
              (click)="onViewAllClick()"
              [attr.aria-label]="'View ' + hiddenCount + ' more badges'"
            >
              <span class="more-count">+{{ hiddenCount }}</span>
              <span class="more-label">MORE</span>
              <span class="more-hint">View all</span>
            </button>
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
  styles: [
    `
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
        font-family: inherit;
        color: var(--neon-cyan);
        margin: 0;
      }

      .badge-count {
        font-size: 0.875rem;
        font-family: inherit;
        color: rgba(255, 255, 255, 0.5);
        background: rgba(0, 0, 0, 0.4);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
      }

      .badges-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        width: 100%;
        overflow-x: hidden;
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
        padding: 1rem 0.75rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        transition: all 0.2s ease;
        cursor: pointer;
        min-width: 0;
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

      .badge-card:active {
        transform: scale(0.96);
      }

      .badge-card:focus-visible {
        outline: 2px solid var(--badge-color);
        outline-offset: 2px;
      }

      .badge-card.legendary {
        animation: pulse-glow 2s ease-in-out infinite;
      }

      @keyframes pulse-glow {
        0%,
        100% {
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
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
        padding: 0 0.25rem;
      }

      .badge-date {
        font-size: 0.625rem;
        color: rgba(255, 255, 255, 0.4);
        font-family: inherit;
      }

      .badge-xp {
        font-size: 0.625rem;
        color: var(--badge-color);
        font-family: inherit;
        font-weight: 600;
        text-shadow: 0 0 8px color-mix(in srgb, var(--badge-color) 50%, transparent);
      }

      /* More card styles */
      .more-card {
        --badge-color: var(--neon-cyan, #00ffff);
        cursor: pointer;
        border-style: dashed;
        background: rgba(0, 255, 255, 0.05);
      }

      .more-card:hover {
        background: rgba(0, 255, 255, 0.1);
      }

      .more-count {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--neon-cyan, #00ffff);
        font-family: inherit;
        line-height: 1;
        text-shadow: 0 0 10px var(--neon-cyan, #00ffff);
      }

      .more-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .more-hint {
        font-size: 0.625rem;
        color: rgba(255, 255, 255, 0.4);
        font-family: inherit;
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
        font-family: inherit;
        margin: 0;
      }
    `,
  ],
})
export class BadgesGridComponent {
  readonly #cdr = inject(ChangeDetectorRef);
  private _badges: UserBadge[] = [];
  private _badgeDisplays: BadgeDisplay[] = [];

  viewAll = output<void>();
  badgeClick = output<UserBadge>();

  @Input()
  set badges(value: UserBadge[]) {
    this._badges = value;
    // Compute badgeDisplays once in setter to avoid repeated allocations with OnPush
    this._badgeDisplays = value.map((badge) => {
      const rarity = getBadgeRarity(badge);
      return {
        badge,
        emoji: getBadgeEmoji(badge),
        rarity,
        color: getBadgeRarityColor(rarity),
      };
    });
    this.#cdr.markForCheck();
  }

  get badges(): UserBadge[] {
    return this._badges;
  }

  get badgeDisplays(): BadgeDisplay[] {
    return this._badgeDisplays;
  }

  get visibleBadges(): BadgeDisplay[] {
    if (this._badgeDisplays.length <= VISIBLE_BADGES_COUNT + 1) {
      // Show all if only 1 more than limit (no point showing "+1")
      return this._badgeDisplays;
    }
    return this._badgeDisplays.slice(0, VISIBLE_BADGES_COUNT);
  }

  get hiddenCount(): number {
    if (this._badgeDisplays.length <= VISIBLE_BADGES_COUNT + 1) {
      return 0;
    }
    return this._badgeDisplays.length - VISIBLE_BADGES_COUNT;
  }

  onViewAllClick(): void {
    this.viewAll.emit();
  }

  onBadgeClick(badge: UserBadge): void {
    this.badgeClick.emit(badge);
  }
}
