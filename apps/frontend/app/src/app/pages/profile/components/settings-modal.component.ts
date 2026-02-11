import { Component, HostListener, output, input, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [],
  template: `
    <div
      class="modal-backdrop"
      (click)="onBackdropClick($event)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      tabindex="-1"
    >
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 id="settings-modal-title" class="modal-title">
            <span class="title-icon">⚙️</span>
            Settings
          </h2>
          <button type="button" class="close-button" (click)="onClose()" aria-label="Close dialog">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="settings-section">
            <h3 class="section-title">Notifications</h3>
            
            <label class="setting-item">
              <div class="setting-info">
                <span class="setting-label">Level-up Notifications</span>
                <span class="setting-description">Show a popup when you level up</span>
              </div>
              <button
                type="button"
                class="toggle-button"
                [class.enabled]="notificationsEnabled()"
                (click)="toggleNotifications()"
                [disabled]="isSaving()"
                [attr.aria-label]="notificationsEnabled() ? 'Disable level-up notifications' : 'Enable level-up notifications'"
                [attr.aria-checked]="notificationsEnabled()"
                role="switch"
              >
                <span class="toggle-slider"></span>
              </button>
            </label>
          </div>

          @if (saveError()) {
            <div class="error-message" role="alert">
              {{ saveError() }}
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

      .settings-section {
        margin-bottom: 1.5rem;
      }

      .section-title {
        font-size: 0.875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--neon-cyan);
        margin-bottom: 1rem;
      }

      .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .setting-item:hover {
        background: rgba(0, 0, 0, 0.6);
      }

      .setting-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
      }

      .setting-label {
        font-size: 0.9375rem;
        font-weight: 500;
        color: white;
      }

      .setting-description {
        font-size: 0.8125rem;
        color: rgba(255, 255, 255, 0.5);
      }

      .toggle-button {
        position: relative;
        width: 48px;
        height: 28px;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .toggle-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .toggle-button.enabled {
        background: var(--neon-cyan);
        border-color: var(--neon-cyan);
      }

      .toggle-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transition: transform 0.2s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .toggle-button.enabled .toggle-slider {
        transform: translateX(20px);
      }

      .error-message {
        margin-top: 1rem;
        padding: 0.75rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 6px;
        color: #fca5a5;
        font-size: 0.875rem;
      }

      @media (prefers-reduced-motion: reduce) {
        .modal-content {
          animation: none;
        }
      }
    `,
  ],
})
export class SettingsModalComponent {
  readonly #http = inject(HttpClient);
  
  userId = input.required<string>();
  initialNotificationsEnabled = input<boolean>(true);
  dismiss = output<void>();

  notificationsEnabled = signal(true);
  isSaving = signal(false);
  saveError = signal<string | null>(null);

  ngOnInit() {
    this.notificationsEnabled.set(this.initialNotificationsEnabled());
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    this.onClose();
  }

  async toggleNotifications() {
    const newValue = !this.notificationsEnabled();
    this.notificationsEnabled.set(newValue);
    this.isSaving.set(true);
    this.saveError.set(null);

    try {
      await this.#http
        .patch(`/users/${this.userId()}`, {
          preferences: {
            notificationsEnabled: newValue,
          },
        })
        .toPromise();
    } catch (error) {
      console.error('Failed to save notification preference:', error);
      this.saveError.set('Failed to save settings. Please try again.');
      // Revert on error
      this.notificationsEnabled.set(!newValue);
    } finally {
      this.isSaving.set(false);
    }
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
