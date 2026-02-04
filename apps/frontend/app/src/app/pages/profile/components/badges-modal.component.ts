import { Component, HostListener, input, output } from '@angular/core';
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
          <h2 id="badges-modal-title" class="modal-title">
            <span class="title-icon">🏅</span>
            All Badges
          </h2>
          <button type="button" class="close-button" (click)="onClose()" aria-label="Close dialog">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="badges-grid" role="list">
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
                  <span class="badge-date">{{ item.badge.earnedAt | date: 'MMM yyyy' }}</span>
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
        box-shadow:
          0 0 8px var(--badge-color),
          0 0 16px color-mix(in srgb, var(--badge-color) 30%, transparent),
          inset 0 0 12px color-mix(in srgb, var(--badge-color) 5%, transparent);
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
export class BadgesModalComponent {
  badges = input<UserBadge[]>([]);
  dismiss = output<void>();

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

  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    this.onClose();
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
