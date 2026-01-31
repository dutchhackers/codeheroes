import { Component, Input, inject, ChangeDetectorRef, ChangeDetectionStrategy, signal } from '@angular/core';
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

          @if (hiddenCount > 0) {
            <button
              class="badge-card more-card"
              (click)="openModal()"
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

    <!-- Modal Overlay -->
    @if (isModalOpen()) {
      <div class="modal-overlay" (click)="closeModal()" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 id="modal-title" class="modal-title">All Badges</h2>
            <button class="modal-close" (click)="closeModal()" aria-label="Close">✕</button>
          </div>
          <div class="modal-body">
            <div class="modal-badges-grid" role="list">
              @for (item of badgeDisplays; track item.badge.id) {
                <div
                  class="badge-card"
                  [class.legendary]="item.rarity === 'LEGENDARY'"
                  [style.--badge-color]="item.color"
                  role="listitem"
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
          </div>
        </div>
      </div>
    }
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

    /* More card styles */
    .more-card {
      --badge-color: var(--neon-cyan, #00ffff);
      cursor: pointer;
      border-style: dashed;
      background: rgba(0, 255, 255, 0.05);
    }

    .more-card:hover {
      background: rgba(0, 255, 255, 0.1);
      transform: scale(1.02);
    }

    .more-count {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--neon-cyan, #00ffff);
      font-family: monospace;
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
      font-family: monospace;
    }

    /* Modal styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: linear-gradient(180deg, rgba(20, 20, 40, 0.98) 0%, rgba(10, 10, 25, 0.98) 100%);
      border: 2px solid var(--neon-cyan, #00ffff);
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow:
        0 0 20px rgba(0, 255, 255, 0.3),
        0 0 40px rgba(0, 255, 255, 0.1),
        inset 0 0 30px rgba(0, 255, 255, 0.05);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(0, 255, 255, 0.2);
    }

    .modal-title {
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-family: monospace;
      color: var(--neon-cyan, #00ffff);
      margin: 0;
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }

    .modal-close {
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.6);
      width: 32px;
      height: 32px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .modal-close:hover {
      border-color: var(--neon-cyan, #00ffff);
      color: var(--neon-cyan, #00ffff);
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
    }

    .modal-body {
      padding: 1.25rem;
      overflow-y: auto;
    }

    .modal-badges-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    @media (min-width: 480px) {
      .modal-badges-grid {
        grid-template-columns: repeat(3, 1fr);
      }
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

  isModalOpen = signal(false);

  @Input()
  set badges(value: UserBadge[]) {
    this._badges = value;
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

  get visibleBadges(): BadgeDisplay[] {
    const displays = this.badgeDisplays;
    if (displays.length <= VISIBLE_BADGES_COUNT + 1) {
      // Show all if only 1 more than limit (no point showing "+1")
      return displays;
    }
    return displays.slice(0, VISIBLE_BADGES_COUNT);
  }

  get hiddenCount(): number {
    const total = this.badgeDisplays.length;
    if (total <= VISIBLE_BADGES_COUNT + 1) {
      return 0;
    }
    return total - VISIBLE_BADGES_COUNT;
  }

  openModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }
}
