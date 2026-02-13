import { Component, HostListener, input, output, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BadgeRarity } from '@codeheroes/types';
import { UserBadge, getBadgeRarity, getBadgeEmoji, getBadgeRarityColor } from '../../../core/models/user-badge.model';

interface BadgeDisplay {
  badge: UserBadge;
  emoji: string;
  rarity: BadgeRarity;
  color: string;
}

@Component({
  selector: 'app-badges-modal',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div
      class="modal-backdrop"
      (click)="onBackdropClick($event)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="badges-modal-title"
      tabindex="-1"
    >
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          @if (selectedBadge()) {
            <button type="button" class="back-button" (click)="clearSelection()" aria-label="Back to all badges">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              All Badges
            </button>
          } @else {
            <h2 id="badges-modal-title" class="modal-title">
              <span class="title-icon">🏅</span>
              All Badges ({{ badges().length }})
            </h2>
          }
          <button type="button" class="close-button" (click)="onClose()" aria-label="Close dialog">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          @if (selectedBadge(); as selected) {
            <div class="badge-detail" [style.--badge-color]="selected.color">
              <div class="detail-emoji">{{ selected.emoji }}</div>
              <h3 class="detail-name">{{ selected.badge.name }}</h3>
              <span class="detail-rarity">{{ selected.rarity }}</span>
              @if (selected.badge.description) {
                <p class="detail-description">{{ selected.badge.description }}</p>
              }
              @if (selected.badge.earnedAt) {
                <div class="detail-earned">
                  <span class="detail-label">Earned</span>
                  <span class="detail-value">{{ selected.badge.earnedAt | date: 'd MMMM yyyy' }}</span>
                </div>
              }
              @if (selected.badge.xp) {
                <div class="detail-xp">+{{ selected.badge.xp }} XP</div>
              }
            </div>
          } @else {
            <div class="badges-grid" role="list">
              @for (item of badgeDisplays; track item.badge.id) {
                <button
                  type="button"
                  class="badge-card"
                  [class.legendary]="item.rarity === 'LEGENDARY'"
                  [style.--badge-color]="item.color"
                  role="listitem"
                  (click)="selectBadge(item)"
                  [attr.aria-label]="item.badge.name + ', ' + item.rarity.toLowerCase() + ' badge. Tap for details'"
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
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        z-index: 100;
        padding: 0;
      }

      @media (min-width: 640px) {
        .modal-backdrop {
          align-items: center;
          padding: 1rem;
        }
      }

      .modal-content {
        background: linear-gradient(135deg, rgba(15, 15, 25, 0.98), rgba(25, 15, 35, 0.98));
        border: 2px solid var(--neon-cyan);
        border-bottom: none;
        border-radius: 16px 16px 0 0;
        width: 100%;
        max-width: 500px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow:
          0 0 20px rgba(0, 245, 255, 0.2),
          0 0 40px rgba(0, 245, 255, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
        animation: slideUp 0.3s ease-out;
      }

      @media (min-width: 640px) {
        .modal-content {
          border-bottom: 2px solid var(--neon-cyan);
          border-radius: 16px;
          animation: fadeIn 0.2s ease-out;
        }
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }

      .modal-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: white;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .title-icon {
        font-size: 1.25rem;
      }

      .close-button {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
        border-radius: 6px;
        min-width: 2.75rem;
        min-height: 2.75rem;
      }

      .close-button:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
      }

      .close-button svg {
        width: 20px;
        height: 20px;
      }

      .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 1.25rem;
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
        cursor: pointer;
        box-shadow:
          0 0 8px var(--badge-color),
          0 0 16px color-mix(in srgb, var(--badge-color) 30%, transparent),
          inset 0 0 12px color-mix(in srgb, var(--badge-color) 5%, transparent);
      }

      .badge-card:active {
        transform: scale(0.96);
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
      }

      .badge-xp {
        font-size: 0.625rem;
        color: var(--badge-color);
        font-weight: 600;
        text-shadow: 0 0 8px color-mix(in srgb, var(--badge-color) 50%, transparent);
      }

      /* Back button */
      .back-button {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        padding: 0.375rem 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: color 0.2s;
        border-radius: 6px;
        min-width: 2.75rem;
        min-height: 2.75rem;
      }

      .back-button:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
      }

      /* Badge detail view */
      .badge-detail {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 1.5rem 1rem;
        gap: 0.75rem;
      }

      .detail-emoji {
        font-size: 3.5rem;
        line-height: 1;
        filter: drop-shadow(0 0 12px var(--badge-color));
      }

      .detail-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0;
      }

      .detail-rarity {
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--badge-color);
        background: color-mix(in srgb, var(--badge-color) 15%, transparent);
        border: 1px solid color-mix(in srgb, var(--badge-color) 40%, transparent);
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
      }

      .detail-description {
        font-size: 0.9375rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.5;
        margin: 0.5rem 0 0;
        max-width: 300px;
      }

      .detail-earned {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        margin-top: 0.5rem;
      }

      .detail-label {
        font-size: 0.625rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(255, 255, 255, 0.4);
      }

      .detail-value {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.8);
      }

      .detail-xp {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--badge-color);
        text-shadow: 0 0 12px color-mix(in srgb, var(--badge-color) 50%, transparent);
        margin-top: 0.25rem;
      }

      @media (prefers-reduced-motion: reduce) {
        .modal-content {
          animation: none;
        }
        .badge-card.legendary {
          animation: none;
        }
      }
    `,
  ],
})
export class BadgesModalComponent implements OnInit {
  badges = input<UserBadge[]>([]);
  initialSelectedBadgeId = input<string | null>(null);
  dismiss = output<void>();
  selectedBadge = signal<BadgeDisplay | null>(null);

  get badgeDisplays(): BadgeDisplay[] {
    return this.badges().map((badge) => {
      const rarity = getBadgeRarity(badge);
      return {
        badge,
        emoji: getBadgeEmoji(badge),
        rarity,
        color: getBadgeRarityColor(rarity),
      };
    });
  }

  ngOnInit() {
    // If an initial badge ID is provided, select it
    const initialId = this.initialSelectedBadgeId();
    if (initialId) {
      const badgeDisplay = this.badgeDisplays.find((item) => item.badge.id === initialId);
      if (badgeDisplay) {
        this.selectedBadge.set(badgeDisplay);
      }
    }
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    if (this.selectedBadge()) {
      this.clearSelection();
    } else {
      this.onClose();
    }
  }

  selectBadge(item: BadgeDisplay) {
    this.selectedBadge.set(item);
  }

  clearSelection() {
    this.selectedBadge.set(null);
  }

  onClose() {
    this.dismiss.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
