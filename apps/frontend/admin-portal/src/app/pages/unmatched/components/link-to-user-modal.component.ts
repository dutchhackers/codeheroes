import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { UnmatchedEvent, UserDto } from '@codeheroes/types';
import { UsersService } from '../../../core/services/users.service';
import { UnmatchedEventsService } from '../../../core/services/unmatched-events.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'admin-link-to-user-modal',
  standalone: true,
  imports: [FormsModule, SuiButtonComponent],
  template: `
    <div class="modal-overlay" (click)="closed.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <h2 class="modal-title">Link to User</h2>
        <p class="modal-subtitle">
          Link {{ event.externalUserName || event.externalUserId }} to an existing user
        </p>

        <div class="form-group">
          <label class="form-label">Search Users</label>
          <input
            class="form-input"
            type="text"
            placeholder="Type to search..."
            [ngModel]="searchInput"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>

        <div class="user-list">
          @if (isSearching()) {
            <div class="list-status">Searching...</div>
          } @else if (users().length === 0 && searchInput) {
            <div class="list-status">No users found</div>
          } @else {
            @for (user of users(); track user.id) {
              <div
                class="user-option"
                [class.user-option--selected]="selectedUserId() === user.id"
                (click)="selectUser(user.id)"
              >
                <div class="user-option-avatar">
                  {{ (user.name || user.displayName)?.charAt(0)?.toUpperCase() || '?' }}
                </div>
                <div>
                  <div class="user-option-name">{{ user.name || user.displayName }}</div>
                  @if (user.email) {
                    <div class="user-option-email">{{ user.email }}</div>
                  }
                </div>
              </div>
            }
          }
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
            [disabled]="isSaving() || !selectedUserId()"
          >
            {{ isSaving() ? 'Linking...' : 'Link User' }}
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
      .user-list {
        max-height: 240px;
        overflow-y: auto;
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 6px;
        margin-bottom: 16px;
      }
      .list-status {
        padding: 16px;
        text-align: center;
        color: var(--theme-color-text-neutral-tertiary);
        font-size: 13px;
      }
      .user-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        cursor: pointer;
        border-bottom: 1px solid var(--theme-color-border-default-default);
        transition: background 0.1s;
      }
      .user-option:last-child {
        border-bottom: none;
      }
      .user-option:hover {
        background: var(--theme-color-bg-neutral-secondary);
      }
      .user-option--selected {
        background: var(--theme-color-bg-brand-secondary);
      }
      .user-option-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--theme-color-bg-neutral-secondary);
        color: var(--theme-color-text-brand-default);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 13px;
        flex-shrink: 0;
      }
      .user-option-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--theme-color-text-default);
      }
      .user-option-email {
        font-size: 12px;
        color: var(--theme-color-text-neutral-tertiary);
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
export class LinkToUserModalComponent implements OnInit, OnDestroy {
  @Input() event!: UnmatchedEvent;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  readonly #usersService = inject(UsersService);
  readonly #unmatchedEventsService = inject(UnmatchedEventsService);

  searchInput = '';
  readonly users = signal<UserDto[]>([]);
  readonly selectedUserId = signal<string | null>(null);
  readonly isSearching = signal(false);
  readonly isSaving = signal(false);
  readonly errorMsg = signal<string | null>(null);

  #searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    if (this.#searchDebounceTimer) {
      clearTimeout(this.#searchDebounceTimer);
    }
  }

  loadUsers(search?: string): void {
    this.isSearching.set(true);
    this.#usersService.getUsers({ limit: 20, search }).subscribe({
      next: (response) => {
        this.users.set(response.items);
        this.isSearching.set(false);
      },
      error: () => this.isSearching.set(false),
    });
  }

  onSearchChange(value: string): void {
    this.searchInput = value;
    if (this.#searchDebounceTimer) {
      clearTimeout(this.#searchDebounceTimer);
    }
    this.#searchDebounceTimer = setTimeout(() => {
      this.loadUsers(value.trim() || undefined);
    }, 300);
  }

  selectUser(id: string): void {
    this.selectedUserId.set(id);
  }

  save(): void {
    const userId = this.selectedUserId();
    if (!userId) return;

    this.isSaving.set(true);
    this.errorMsg.set(null);

    this.#usersService
      .addConnectedAccount(userId, {
        provider: this.event.provider,
        externalUserId: this.event.externalUserId!,
        externalUserName: this.event.externalUserName,
      })
      .pipe(
        switchMap(() =>
          this.#unmatchedEventsService.resolve(this.event.id, {
            resolutionAction: 'linked_to_user',
            resolutionTargetId: userId,
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMsg.set(err?.error?.error || 'Failed to link user');
          console.error('Failed to link user:', err);
        },
      });
  }
}
