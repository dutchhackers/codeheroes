import { Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-level-up-popup',
  standalone: true,
  imports: [],
  template: `
    <div
      class="modal-backdrop"
      (click)="onBackdropClick($event)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
      tabindex="-1"
    >
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="celebration-container">
          <div class="stars-container">
            <span class="star star-1">⭐</span>
            <span class="star star-2">✨</span>
            <span class="star star-3">💫</span>
            <span class="star star-4">⭐</span>
            <span class="star star-5">✨</span>
          </div>
          
          <div class="level-badge">
            <div class="level-number">{{ level() }}</div>
            <div class="level-label">LEVEL</div>
          </div>
          
          <h2 id="level-up-title" class="title">🎉 Level Up! 🎉</h2>
          
          @if (message()) {
            <p class="message">{{ message() }}</p>
          } @else {
            <p class="message">Congratulations! You've reached level {{ level() }}!</p>
          }
          
          <button
            type="button"
            class="close-btn"
            (click)="onClose()"
            aria-label="Close notification"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .modal-content {
        background: linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(45, 15, 65, 0.95));
        border: 3px solid #ffd700;
        border-radius: 20px;
        max-width: 400px;
        width: 100%;
        box-shadow:
          0 0 40px rgba(255, 215, 0, 0.4),
          0 0 80px rgba(255, 215, 0, 0.2),
          inset 0 2px 0 rgba(255, 255, 255, 0.1);
        animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      @keyframes bounceIn {
        0% {
          transform: scale(0.3);
          opacity: 0;
        }
        50% {
          transform: scale(1.05);
        }
        70% {
          transform: scale(0.95);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      .celebration-container {
        position: relative;
        padding: 2rem 1.5rem 1.5rem;
        text-align: center;
      }

      .stars-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        border-radius: 20px;
      }

      .star {
        position: absolute;
        font-size: 1.5rem;
        animation: float 3s ease-in-out infinite;
      }

      .star-1 {
        top: 10%;
        left: 15%;
        animation-delay: 0s;
      }

      .star-2 {
        top: 20%;
        right: 20%;
        animation-delay: 0.5s;
      }

      .star-3 {
        top: 60%;
        left: 10%;
        animation-delay: 1s;
      }

      .star-4 {
        top: 70%;
        right: 15%;
        animation-delay: 1.5s;
      }

      .star-5 {
        top: 40%;
        right: 10%;
        animation-delay: 2s;
      }

      @keyframes float {
        0%, 100% {
          transform: translateY(0) rotate(0deg);
          opacity: 0.6;
        }
        50% {
          transform: translateY(-15px) rotate(180deg);
          opacity: 1;
        }
      }

      .level-badge {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 120px;
        height: 120px;
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        border: 4px solid #fff;
        border-radius: 50%;
        box-shadow:
          0 0 30px rgba(255, 215, 0, 0.6),
          0 0 60px rgba(255, 215, 0, 0.3),
          inset 0 4px 8px rgba(255, 255, 255, 0.3);
        margin: 0 auto 1.5rem;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          box-shadow:
            0 0 30px rgba(255, 215, 0, 0.6),
            0 0 60px rgba(255, 215, 0, 0.3),
            inset 0 4px 8px rgba(255, 255, 255, 0.3);
        }
        50% {
          transform: scale(1.05);
          box-shadow:
            0 0 40px rgba(255, 215, 0, 0.8),
            0 0 80px rgba(255, 215, 0, 0.5),
            inset 0 4px 8px rgba(255, 255, 255, 0.3);
        }
      }

      .level-number {
        font-size: 3rem;
        font-weight: 900;
        color: #333;
        line-height: 1;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      }

      .level-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #333;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-top: 0.25rem;
      }

      .title {
        font-size: 1.75rem;
        font-weight: 800;
        color: #ffd700;
        margin: 0 0 1rem;
        text-shadow:
          0 0 20px rgba(255, 215, 0, 0.6),
          2px 2px 4px rgba(0, 0, 0, 0.3);
        animation: glow 2s ease-in-out infinite;
      }

      @keyframes glow {
        0%, 100% {
          text-shadow:
            0 0 20px rgba(255, 215, 0, 0.6),
            2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        50% {
          text-shadow:
            0 0 30px rgba(255, 215, 0, 0.9),
            0 0 50px rgba(255, 215, 0, 0.5),
            2px 2px 4px rgba(0, 0, 0, 0.3);
        }
      }

      .message {
        font-size: 1.125rem;
        color: rgba(255, 255, 255, 0.9);
        line-height: 1.5;
        margin: 0 0 2rem;
      }

      .close-btn {
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        color: #333;
        border: none;
        border-radius: 12px;
        padding: 0.875rem 2.5rem;
        font-size: 1rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow:
          0 4px 12px rgba(255, 215, 0, 0.4),
          inset 0 2px 0 rgba(255, 255, 255, 0.3);
      }

      .close-btn:hover {
        background: linear-gradient(135deg, #ffed4e 0%, #ffd700 100%);
        transform: translateY(-2px);
        box-shadow:
          0 6px 20px rgba(255, 215, 0, 0.6),
          inset 0 2px 0 rgba(255, 255, 255, 0.3);
      }

      .close-btn:active {
        transform: translateY(0);
        box-shadow:
          0 2px 8px rgba(255, 215, 0, 0.4),
          inset 0 2px 0 rgba(255, 255, 255, 0.3);
      }

      @media (prefers-reduced-motion: reduce) {
        .modal-backdrop,
        .modal-content,
        .star,
        .level-badge,
        .title {
          animation: none;
        }
      }
    `,
  ],
})
export class LevelUpPopupComponent {
  level = input.required<number>();
  message = input<string>();
  dismiss = output<void>();

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
