import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { ConnectedAccountDto, ConnectedAccountProvider, CONNECTED_ACCOUNT_PROVIDERS, UserDto, UserRole } from '@codeheroes/types';
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
          @if (u.photoUrl) {
            <img class="user-avatar-lg-img" [src]="u.photoUrl" [alt]="(u.name || u.displayName) + ' avatar'" />
          } @else {
            <div class="user-avatar-lg">{{ (u.name || u.displayName)?.charAt(0)?.toUpperCase() || '?' }}</div>
          }
          <div class="user-info">
            <h1 class="user-name">{{ u.name || u.displayName || 'Unknown' }}</h1>
            @if (u.name && u.displayName && u.name !== u.displayName) {
              <p class="user-display-name">{{ u.displayName }}</p>
            }
            @if (u.email) {
              <p class="user-email">{{ u.email }}</p>
            }
            <p class="user-meta">
              Type: <span class="user-type-badge" [class.user-type-bot]="u.userType !== 'user'">{{ u.userType }}</span>
              @if (u.role === 'admin') {
                · <span class="role-badge role-admin">Admin</span>
              }
              · Joined: {{ u.createdAt | date: 'mediumDate' }}
            </p>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h2 class="section-title">User Details</h2>
          </div>
          <div class="settings-card">
            <div class="settings-row">
              <div class="settings-label">Name</div>
              <div class="settings-value">
                <input
                  class="form-input settings-input"
                  type="text"
                  [(ngModel)]="formName"
                  placeholder="Name"
                />
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-label">Display Name</div>
              <div class="settings-value">
                <input
                  class="form-input settings-input"
                  type="text"
                  [(ngModel)]="formDisplayName"
                  placeholder="Display Name"
                />
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-label">Photo URL</div>
              <div class="settings-value">
                <input
                  class="form-input settings-input settings-input-wide"
                  type="url"
                  [(ngModel)]="formPhotoUrl"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-label">User Type</div>
              <div class="settings-value">
                <select class="form-input settings-select" [(ngModel)]="formUserType">
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
                  <input type="checkbox" [(ngModel)]="formActive" />
                  <span class="status-label" [class.status-active]="formActive" [class.status-inactive]="!formActive">
                    {{ formActive ? 'Active' : 'Inactive' }}
                  </span>
                </label>
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-label">Role</div>
              <div class="settings-value role-value">
                <span class="role-badge" [class.role-admin]="u.role === 'admin'">{{ u.role || 'user' }}</span>
                @if (!isRoleSaving()) {
                  <sui-button
                    variant="outline"
                    color="neutral"
                    size="sm"
                    (click)="toggleRole()"
                  >
                    {{ u.role === 'admin' ? 'Demote to User' : 'Promote to Admin' }}
                  </sui-button>
                } @else {
                  <span class="saving-label">Saving...</span>
                }
                @if (roleError()) {
                  <span class="form-error">{{ roleError() }}</span>
                }
              </div>
            </div>
            <div class="settings-row settings-actions">
              @if (saveError()) {
                <p class="form-error">{{ saveError() }}</p>
              }
              <sui-button
                variant="solid"
                color="brand"
                size="sm"
                [disabled]="!hasChanges() || isSaving()"
                (click)="saveUserDetails()"
              >
                {{ isSaving() ? 'Saving...' : 'Save' }}
              </sui-button>
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
                <sui-button variant="solid" color="brand" size="sm" [disabled]="!canSaveAccount()" (click)="addAccount()">
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

      .user-avatar-lg-img {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        object-fit: cover;
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

      .settings-actions {
        justify-content: flex-end;
        gap: 12px;
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

      .settings-input {
        max-width: 280px;
      }

      .settings-input-wide {
        max-width: 440px;
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

      .role-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        background: var(--theme-color-bg-neutral-secondary);
        color: var(--theme-color-text-neutral-secondary);
        text-transform: capitalize;
      }

      .role-admin {
        background: var(--theme-color-bg-brand-default);
        color: #fff;
      }

      .role-value {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .saving-label {
        font-size: 13px;
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
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly isRoleSaving = signal(false);
  readonly roleError = signal<string | null>(null);

  readonly providers = CONNECTED_ACCOUNT_PROVIDERS.filter((p) => p !== 'system');

  // Connected accounts form
  newProvider: ConnectedAccountProvider | '' = '';
  newExternalUserId = '';
  newExternalUserName = '';

  // User details form
  formName = '';
  formDisplayName = '';
  formPhotoUrl = '';
  formUserType = 'user';
  formActive = true;

  #userId = '';

  ngOnInit(): void {
    this.#userId = this.#route.snapshot.params['id'];
    this.loadUser();
    this.loadAccounts();
  }

  hasChanges(): boolean {
    const u = this.user();
    if (!u) return false;
    const trimmedName = this.formName.trim();
    const trimmedDisplayName = this.formDisplayName.trim();
    if (!trimmedName || !trimmedDisplayName) return false;
    return (
      trimmedName !== (u.name || '') ||
      trimmedDisplayName !== (u.displayName || '') ||
      this.formPhotoUrl.trim() !== (u.photoUrl || '') ||
      this.formUserType !== (u.userType || 'user') ||
      this.formActive !== u.active
    );
  }

  canSaveAccount(): boolean {
    return this.newProvider !== '' && this.newExternalUserId.trim() !== '';
  }

  loadUser(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.#usersService.getUser(this.#userId).subscribe({
      next: (user) => {
        this.user.set(user);
        this.#initForm(user);
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

  saveUserDetails(): void {
    const u = this.user();
    if (!u || !this.hasChanges()) return;

    this.isSaving.set(true);
    this.saveError.set(null);

    const updates: Record<string, unknown> = {};
    if (this.formName !== (u.name || '')) {
      updates['name'] = this.formName.trim();
    }
    if (this.formDisplayName !== (u.displayName || '')) {
      updates['displayName'] = this.formDisplayName.trim();
    }
    const trimmedPhotoUrl = this.formPhotoUrl.trim();
    if (trimmedPhotoUrl !== (u.photoUrl || '')) {
      updates['photoUrl'] = trimmedPhotoUrl || null;
    }
    if (this.formUserType !== (u.userType || 'user')) {
      updates['userType'] = this.formUserType;
    }
    if (this.formActive !== u.active) {
      updates['active'] = this.formActive;
    }

    this.#usersService.updateUser(this.#userId, updates).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.#initForm(updated);
        this.isSaving.set(false);
      },
      error: () => {
        this.saveError.set('Failed to save changes.');
        this.isSaving.set(false);
      },
    });
  }

  addAccount(): void {
    if (!this.canSaveAccount()) return;
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

  toggleRole(): void {
    const u = this.user();
    if (!u) return;

    const newRole: UserRole = u.role === 'admin' ? 'user' : 'admin';
    this.isRoleSaving.set(true);
    this.roleError.set(null);

    this.#usersService.updateUserRole(u.id, newRole).subscribe({
      next: () => {
        this.user.update((current) => current ? { ...current, role: newRole } : current);
        this.isRoleSaving.set(false);
      },
      error: () => {
        this.roleError.set('Failed to update role.');
        this.isRoleSaving.set(false);
      },
    });
  }

  goBack(): void {
    this.#router.navigate(['/users']);
  }

  #initForm(user: UserDto): void {
    this.formName = user.name || '';
    this.formDisplayName = user.displayName || '';
    this.formPhotoUrl = user.photoUrl || '';
    this.formUserType = user.userType || 'user';
    this.formActive = user.active;
  }
}
