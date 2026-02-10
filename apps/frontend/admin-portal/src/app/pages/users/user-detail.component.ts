import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { ConnectedAccountDto, ConnectedAccountProvider, CONNECTED_ACCOUNT_PROVIDERS, UserDto } from '@codeheroes/types';
import { UsersService } from '../../core/services/users.service';

@Component({
  selector: 'admin-user-detail',
  standalone: true,
  imports: [DatePipe, FormsModule, SuiButtonComponent],
  template: `
    <div>
      <button type="button" class="back-link" (click)="goBack()">← Back to Users</button>

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
          <div class="user-avatar-lg">{{ (u.name || u.displayName)?.charAt(0)?.toUpperCase() || '?' }}</div>
          <div class="user-info">
            @if (isEditingName()) {
              <div class="inline-edit">
                <input
                  class="form-input name-edit-input"
                  type="text"
                  [(ngModel)]="editNameValue"
                  (keydown.enter)="saveName()"
                  (keydown.escape)="cancelEditName()"
                  placeholder="Name"
                />
                <div class="inline-edit-actions">
                  <sui-button variant="solid" color="brand" size="sm" (click)="saveName()" [disabled]="isSavingName()">
                    Save
                  </sui-button>
                  <sui-button variant="outline" color="neutral" size="sm" (click)="cancelEditName()">
                    Cancel
                  </sui-button>
                </div>
              </div>
            } @else {
              <h1 class="user-name editable" (click)="startEditName()" title="Click to edit name">
                {{ u.name || u.displayName || 'Unknown' }}
                <span class="edit-icon">✎</span>
              </h1>
            }
            @if (u.displayName && u.name !== u.displayName) {
              <p class="user-display-name">{{ u.displayName }}</p>
            }
            @if (u.email) {
              <p class="user-email">{{ u.email }}</p>
            }
            <p class="user-meta">
              Type: <span class="user-type-badge" [class.user-type-bot]="u.userType !== 'user'">{{ u.userType }}</span>
              · Joined: {{ u.createdAt | date: 'mediumDate' }}
            </p>
            @if (nameError()) {
              <p class="form-error">{{ nameError() }}</p>
            }
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Account Settings</h2>
          </div>
          <div class="settings-card">
            <div class="settings-row">
              <div class="settings-label">Display Name</div>
              <div class="settings-value">
                @if (isEditingDisplayName()) {
                  <div class="inline-edit-row">
                    <input
                      class="form-input settings-input"
                      type="text"
                      [(ngModel)]="editDisplayNameValue"
                      (keydown.enter)="saveDisplayName()"
                      (keydown.escape)="cancelEditDisplayName()"
                      placeholder="Display Name"
                    />
                    <div class="inline-edit-actions">
                      <sui-button variant="solid" color="brand" size="sm" (click)="saveDisplayName()" [disabled]="isSavingDisplayName()">
                        Save
                      </sui-button>
                      <sui-button variant="outline" color="neutral" size="sm" (click)="cancelEditDisplayName()">
                        Cancel
                      </sui-button>
                    </div>
                  </div>
                  @if (displayNameError()) {
                    <p class="form-error">{{ displayNameError() }}</p>
                  }
                } @else {
                  <span class="editable" (click)="startEditDisplayName()" title="Click to edit">
                    {{ u.displayName || '—' }}
                    <span class="edit-icon">✎</span>
                  </span>
                }
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-label">User Type</div>
              <div class="settings-value">
                <select class="form-input settings-select" [ngModel]="u.userType" (ngModelChange)="changeUserType($event)">
                  <option value="user">user</option>
                  <option value="bot">bot</option>
                  <option value="system">system</option>
                </select>
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-label">Status</div>
              <div class="settings-value">
                <label class="status-toggle">
                  <input type="checkbox" [checked]="u.active" (change)="toggleActive()" />
                  <span class="status-label" [class.status-active]="u.active" [class.status-inactive]="!u.active">
                    {{ u.active ? 'Active' : 'Inactive' }}
                  </span>
                </label>
              </div>
            </div>
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
          } @else if (accountsError()) {
            <div class="error-state">
              <p>{{ accountsError() }}</p>
              <sui-button variant="outline" color="neutral" size="sm" (click)="loadAccounts()">
                Try again
              </sui-button>
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
        padding: 0;
        border: none;
        background: none;
        font-size: 14px;
        color: var(--theme-color-text-brand-default);
        cursor: pointer;
        font-family: inherit;
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

      .user-info .user-display-name {
        font-size: 14px;
        color: var(--theme-color-text-neutral-secondary);
        margin-bottom: 2px;
      }

      .user-info .user-email {
        font-size: 14px;
        color: var(--theme-color-text-neutral-tertiary);
        margin-bottom: 4px;
      }

      .editable {
        cursor: pointer;
      }

      .editable:hover .edit-icon {
        opacity: 1;
      }

      .edit-icon {
        font-size: 14px;
        opacity: 0;
        margin-left: 8px;
        color: var(--theme-color-text-neutral-tertiary);
        transition: opacity 0.2s;
      }

      .inline-edit {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 4px;
      }

      .name-edit-input {
        font-size: 20px;
        font-weight: 700;
        padding: 4px 8px;
      }

      .inline-edit-actions {
        display: flex;
        gap: 8px;
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

      .settings-card {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 8px;
        overflow: hidden;
      }

      .settings-row {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--theme-color-border-default-default);
      }

      .settings-row:last-child {
        border-bottom: none;
      }

      .settings-label {
        width: 140px;
        flex-shrink: 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--theme-color-text-neutral-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .settings-value {
        flex: 1;
        font-size: 14px;
        color: var(--theme-color-text-default);
      }

      .settings-value .editable {
        display: inline-flex;
        align-items: center;
      }

      .inline-edit-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .settings-input {
        max-width: 280px;
      }

      .settings-select {
        max-width: 160px;
        cursor: pointer;
      }

      .status-toggle {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .status-toggle input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: var(--theme-color-bg-brand-default);
      }

      .status-label {
        font-size: 14px;
        font-weight: 500;
      }

      .status-active {
        color: var(--theme-color-text-brand-default);
      }

      .status-inactive {
        color: var(--theme-color-text-neutral-tertiary);
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
  readonly accountsError = signal<string | null>(null);
  readonly showAddForm = signal(false);
  readonly addError = signal<string | null>(null);
  readonly isEditingName = signal(false);
  readonly isSavingName = signal(false);
  readonly nameError = signal<string | null>(null);
  readonly isEditingDisplayName = signal(false);
  readonly isSavingDisplayName = signal(false);
  readonly displayNameError = signal<string | null>(null);

  readonly providers = CONNECTED_ACCOUNT_PROVIDERS.filter((p) => p !== 'system');

  newProvider: ConnectedAccountProvider | '' = '';
  newExternalUserId = '';
  newExternalUserName = '';
  editNameValue = '';
  editDisplayNameValue = '';

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
    this.accountsError.set(null);

    this.#usersService.getConnectedAccounts(this.#userId).subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.accountsLoading.set(false);
      },
      error: () => {
        this.accountsError.set('Failed to load connected accounts.');
        this.accountsLoading.set(false);
      },
    });
  }

  addAccount(): void {
    if (!this.canSave()) return;
    this.addError.set(null);

    const provider = this.newProvider as ConnectedAccountProvider;
    const data: { provider: ConnectedAccountProvider; externalUserId: string; externalUserName?: string } = {
      provider,
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

  startEditName(): void {
    const u = this.user();
    this.editNameValue = u?.name || u?.displayName || '';
    this.isEditingName.set(true);
    this.nameError.set(null);
  }

  cancelEditName(): void {
    this.isEditingName.set(false);
    this.nameError.set(null);
  }

  saveName(): void {
    const trimmed = this.editNameValue.trim();
    if (!trimmed) return;

    this.isSavingName.set(true);
    this.nameError.set(null);

    this.#usersService.updateUser(this.#userId, { name: trimmed }).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.isEditingName.set(false);
        this.isSavingName.set(false);
      },
      error: () => {
        this.nameError.set('Failed to update name.');
        this.isSavingName.set(false);
      },
    });
  }

  startEditDisplayName(): void {
    const u = this.user();
    this.editDisplayNameValue = u?.displayName || '';
    this.isEditingDisplayName.set(true);
    this.displayNameError.set(null);
  }

  cancelEditDisplayName(): void {
    this.isEditingDisplayName.set(false);
    this.displayNameError.set(null);
  }

  saveDisplayName(): void {
    const trimmed = this.editDisplayNameValue.trim();
    if (!trimmed || trimmed.length < 2) return;

    this.isSavingDisplayName.set(true);
    this.displayNameError.set(null);

    this.#usersService.updateUser(this.#userId, { displayName: trimmed }).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.isEditingDisplayName.set(false);
        this.isSavingDisplayName.set(false);
      },
      error: () => {
        this.displayNameError.set('Failed to update display name.');
        this.isSavingDisplayName.set(false);
      },
    });
  }

  changeUserType(userType: string): void {
    this.#usersService.updateUser(this.#userId, { userType }).subscribe({
      next: (updated) => this.user.set(updated),
      error: () => alert('Failed to update user type.'),
    });
  }

  toggleActive(): void {
    const u = this.user();
    if (!u) return;

    const newActive = !u.active;
    this.#usersService.updateUser(this.#userId, { active: newActive }).subscribe({
      next: (updated) => this.user.set(updated),
      error: () => alert('Failed to update status.'),
    });
  }

  goBack(): void {
    this.#router.navigate(['/users']);
  }
}
