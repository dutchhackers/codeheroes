import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { UnmatchedEvent } from '@codeheroes/types';
import { UsersService } from '../../../core/services/users.service';
import { UnmatchedEventsService } from '../../../core/services/unmatched-events.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'admin-create-user-modal',
  standalone: true,
  imports: [FormsModule, SuiButtonComponent],
  template: `
    <div class="modal-overlay" (click)="closed.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <h2 class="modal-title">Create User</h2>
        <p class="modal-subtitle">Create a new user and link the external account</p>

        <div class="form-group">
          <label class="form-label">Display Name *</label>
          <input class="form-input" type="text" [(ngModel)]="displayName" placeholder="Display name" />
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input class="form-input" type="email" [(ngModel)]="email" placeholder="Email address" />
        </div>
        <div class="form-group">
          <label class="form-label">Name</label>
          <input class="form-input" type="text" [(ngModel)]="name" placeholder="Full name (optional)" />
        </div>

        @if (errorMsg()) {
          <div class="form-error">{{ errorMsg() }}</div>
        }

        <div class="modal-actions">
          <sui-button variant="outline" color="neutral" size="sm" (click)="closed.emit()" [disabled]="isSaving()">
            Cancel
          </sui-button>
          <sui-button
            variant="solid"
            color="brand"
            size="sm"
            (click)="save()"
            [disabled]="isSaving() || !displayName || !email"
          >
            {{ isSaving() ? 'Creating...' : 'Create User' }}
          </sui-button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal-card {
        background: var(--theme-color-bg-surface-default);
        border-radius: 12px;
        padding: 24px;
        width: 480px;
        max-width: 90vw;
        box-shadow: var(--theme-effect-styles-drop-shadow-200);
      }
      .modal-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--theme-color-text-default);
        margin-bottom: 4px;
      }
      .modal-subtitle {
        font-size: 14px;
        color: var(--theme-color-text-neutral-tertiary);
        margin-bottom: 20px;
      }
      .form-group {
        margin-bottom: 16px;
      }
      .form-label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: var(--theme-color-text-default);
        margin-bottom: 6px;
      }
      .form-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 6px;
        font-size: 14px;
        color: var(--theme-color-text-default);
        background: var(--theme-color-bg-surface-default);
        font-family: inherit;
        box-sizing: border-box;
      }
      .form-input:focus {
        outline: none;
        border-color: var(--theme-color-border-brand-default);
      }
      .form-error {
        background: var(--theme-color-feedback-bg-error-secondary);
        border: 1px solid var(--theme-color-feedback-border-error-default);
        color: var(--theme-color-feedback-text-error-default);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 13px;
        margin-bottom: 16px;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
      }
    `,
  ],
})
export class CreateUserModalComponent implements OnInit {
  @Input() event!: UnmatchedEvent;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  readonly #usersService = inject(UsersService);
  readonly #unmatchedEventsService = inject(UnmatchedEventsService);

  displayName = '';
  email = '';
  name = '';

  readonly isSaving = signal(false);
  readonly errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.displayName = this.event.externalUserName || '';
  }

  save(): void {
    if (!this.displayName || !this.email) return;

    this.isSaving.set(true);
    this.errorMsg.set(null);

    const userData: { displayName: string; email: string; name?: string } = {
      displayName: this.displayName,
      email: this.email,
    };
    if (this.name) {
      userData.name = this.name;
    }

    this.#usersService
      .createUser(userData)
      .pipe(
        switchMap((user) =>
          this.#usersService
            .addConnectedAccount(user.id, {
              provider: this.event.provider,
              externalUserId: this.event.externalUserId!,
              externalUserName: this.event.externalUserName,
            })
            .pipe(
              switchMap(() =>
                this.#unmatchedEventsService.resolve(this.event.id, {
                  resolutionAction: 'created_user',
                  resolutionTargetId: user.id,
                }),
              ),
            ),
        ),
      )
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMsg.set(err?.error?.error || 'Failed to create user');
          console.error('Failed to create user:', err);
        },
      });
  }
}
