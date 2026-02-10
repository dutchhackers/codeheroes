import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { ConnectedAccountDto, CONNECTED_ACCOUNT_PROVIDERS, UserDto } from '@codeheroes/types';
import { UsersService } from '../../core/services/users.service';

@Component({
  selector: 'admin-user-detail',
  standalone: true,
  imports: [DatePipe, FormsModule, SuiButtonComponent],
  template: `
    <div>
      <a class="back-link" (click)="goBack()">← Back to Users</a>

      @if (isLoading()) {
        <div class="loading-state">
          <p>Loading user...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <sui-button variant="outline" color="neutral" size="sm" (click)="loadUser()">
            Try again
          </sui-button>
        </div>
      } @else if (user(); as u) {
        <div class="user-header">
          <div class="user-avatar-lg">{{ u.displayName?.charAt(0)?.toUpperCase() || '?' }}</div>
          <div class="user-info">
            <h1 class="user-name">{{ u.displayName || 'Unknown' }}</h1>
            @if (u.email) {
              <p class="user-email">{{ u.email }}</p>
            }
            <p class="user-meta">
              Type: <span class="user-type-badge" [class.user-type-bot]="u.userType !== 'user'">{{ u.userType }}</span>
              · Joined: {{ u.createdAt | date: 'mediumDate' }}
            </p>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Connected Accounts</h2>
            @if (!showAddForm()) {
              <sui-button variant="outline" color="neutral" size="sm" (click)="showAddForm.set(true)">
                + Add
              </sui-button>
            }
          </div>

          @if (showAddForm()) {
            <div class="add-form">
              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">Provider</label>
                  <select class="form-input" [(ngModel)]="newProvider">
                    <option value="">Select provider...</option>
                    @for (p of providers; track p) {
                      <option [value]="p">{{ p }}</option>
                    }
                  </select>
                </div>
                <div class="form-field">
                  <label class="form-label">External User ID</label>
                  <input class="form-input" type="text" [(ngModel)]="newExternalUserId" placeholder="e.g. 7045335" />
                </div>
                <div class="form-field">
                  <label class="form-label">Username (optional)</label>
                  <input class="form-input" type="text" [(ngModel)]="newExternalUserName" placeholder="e.g. mschilling" />
                </div>
              </div>
              <div class="form-actions">
                <sui-button variant="solid" color="brand" size="sm" [disabled]="!canSave()" (click)="addAccount()">
                  Save
                </sui-button>
                <sui-button variant="outline" color="neutral" size="sm" (click)="cancelAdd()">
                  Cancel
                </sui-button>
              </div>
              @if (addError()) {
                <p class="form-error">{{ addError() }}</p>
              }
            </div>
          }

          @if (accountsLoading()) {
            <div class="loading-state">
              <p>Loading connected accounts...</p>
            </div>
          } @else if (accounts().length === 0) {
            <div class="empty-state">
              <p>No connected accounts.</p>
            </div>
          } @else {
            <div class="table-container">
              <table class="accounts-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>User ID</th>
                    <th>Username</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (account of accounts(); track account.id) {
                    <tr>
                      <td><span class="provider-badge">{{ account.provider }}</span></td>
                      <td class="monospace">{{ account.externalUserId }}</td>
                      <td>{{ account.externalUserName || '—' }}</td>
                      <td>{{ account.createdAt | date: 'mediumDate' }}</td>
                      <td>
                        <sui-button
                          variant="outline"
                          color="neutral"
                          size="sm"
                          (click)="removeAccount(account)"
                        >
                          Remove
                        </sui-button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .back-link {
        display: inline-block;
        margin-bottom: 24px;
        font-size: 14px;
        color: var(--theme-color-text-brand-default);
        cursor: pointer;
      }

      .back-link:hover {
        text-decoration: underline;
      }

      .loading-state,
      .empty-state {
        text-align: center;
        padding: 48px 0;
        color: var(--theme-color-text-neutral-tertiary);
        font-size: 14px;
      }

      .error-state {
        background: var(--theme-color-feedback-bg-error-secondary);
        border: 1px solid var(--theme-color-feedback-border-error-default);
        border-radius: 8px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--theme-color-feedback-text-error-default);
        font-size: 14px;
      }

      .user-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 32px;
      }

      .user-avatar-lg {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--theme-color-bg-neutral-secondary);
        color: var(--theme-color-text-brand-default);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 22px;
        flex-shrink: 0;
      }

      .user-info .user-name {
        font-size: 24px;
        font-weight: 700;
        color: var(--theme-color-text-default);
        margin-bottom: 2px;
      }

      .user-info .user-email {
        font-size: 14px;
        color: var(--theme-color-text-neutral-tertiary);
        margin-bottom: 4px;
      }

      .user-meta {
        font-size: 13px;
        color: var(--theme-color-text-neutral-tertiary);
      }

      .user-type-badge {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        background: var(--theme-color-bg-neutral-secondary);
        color: var(--theme-color-text-neutral-secondary);
        text-transform: capitalize;
      }

      .user-type-bot {
        background: var(--theme-color-bg-brand-default);
        color: #fff;
      }

      .section {
        margin-bottom: 32px;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--theme-color-text-default);
      }

      .table-container {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 8px;
        overflow: hidden;
      }

      .accounts-table {
        width: 100%;
        border-collapse: collapse;
      }

      .accounts-table th {
        text-align: left;
        padding: 12px 16px;
        font-size: 12px;
        font-weight: 600;
        color: var(--theme-color-text-neutral-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--theme-color-border-default-default);
        background: var(--theme-color-bg-neutral-secondary);
      }

      .accounts-table td {
        padding: 12px 16px;
        font-size: 14px;
        color: var(--theme-color-text-default);
        border-bottom: 1px solid var(--theme-color-border-default-default);
      }

      .accounts-table tr:last-child td {
        border-bottom: none;
      }

      .provider-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        background: var(--theme-color-bg-neutral-secondary);
        color: var(--theme-color-text-neutral-secondary);
      }

      .monospace {
        font-family: monospace;
        font-size: 13px;
      }

      .add-form {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .form-row {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
      }

      .form-field {
        flex: 1;
      }

      .form-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--theme-color-text-neutral-tertiary);
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .form-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 6px;
        font-size: 14px;
        color: var(--theme-color-text-default);
        background: var(--theme-color-bg-surface-default);
        box-sizing: border-box;
      }

      .form-input:focus {
        outline: none;
        border-color: var(--theme-color-border-brand-default);
      }

      .form-actions {
        display: flex;
        gap: 8px;
      }

      .form-error {
        margin-top: 8px;
        font-size: 13px;
        color: var(--theme-color-feedback-text-error-default);
      }
    `,
  ],
})
export class UserDetailComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #usersService = inject(UsersService);

  readonly user = signal<UserDto | null>(null);
  readonly accounts = signal<ConnectedAccountDto[]>([]);
  readonly isLoading = signal(true);
  readonly accountsLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showAddForm = signal(false);
  readonly addError = signal<string | null>(null);

  readonly providers = CONNECTED_ACCOUNT_PROVIDERS.filter((p) => p !== 'system');

  newProvider = '';
  newExternalUserId = '';
  newExternalUserName = '';

  #userId = '';

  ngOnInit(): void {
    this.#userId = this.#route.snapshot.params['id'];
    this.loadUser();
    this.loadAccounts();
  }

  canSave(): boolean {
    return this.newProvider !== '' && this.newExternalUserId.trim() !== '';
  }

  loadUser(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.#usersService.getUser(this.#userId).subscribe({
      next: (user) => {
        this.user.set(user);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load user.');
        this.isLoading.set(false);
      },
    });
  }

  loadAccounts(): void {
    this.accountsLoading.set(true);

    this.#usersService.getConnectedAccounts(this.#userId).subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.accountsLoading.set(false);
      },
      error: () => {
        this.accounts.set([]);
        this.accountsLoading.set(false);
      },
    });
  }

  addAccount(): void {
    if (!this.canSave()) return;
    this.addError.set(null);

    const data: { provider: string; externalUserId: string; externalUserName?: string } = {
      provider: this.newProvider,
      externalUserId: this.newExternalUserId.trim(),
    };
    if (this.newExternalUserName.trim()) {
      data.externalUserName = this.newExternalUserName.trim();
    }

    this.#usersService.addConnectedAccount(this.#userId, data).subscribe({
      next: (account) => {
        this.accounts.update((list) => [...list, account]);
        this.cancelAdd();
      },
      error: () => {
        this.addError.set('Failed to add connected account.');
      },
    });
  }

  removeAccount(account: ConnectedAccountDto): void {
    if (!confirm(`Remove ${account.provider} account "${account.externalUserId}"?`)) return;

    this.#usersService.removeConnectedAccount(this.#userId, account.id).subscribe({
      next: () => {
        this.accounts.update((list) => list.filter((a) => a.id !== account.id));
      },
      error: () => {
        alert('Failed to remove connected account.');
      },
    });
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
    this.newProvider = '';
    this.newExternalUserId = '';
    this.newExternalUserName = '';
    this.addError.set(null);
  }

  goBack(): void {
    this.#router.navigate(['/users']);
  }
}
