import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { UsersService, UserSummary } from '../../core/services/users.service';

@Component({
  selector: 'admin-users',
  standalone: true,
  imports: [DatePipe, SuiButtonComponent],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Users</h1>
          @if (!isLoading() && !error()) {
            <p class="page-subtitle">{{ users().length }} registered users</p>
          }
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <p>Loading users...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <sui-button variant="outline" color="neutral" size="sm" (click)="loadUsers()">
            Try again
          </sui-button>
        </div>
      } @else if (users().length === 0) {
        <div class="empty-state">
          <p>No users found.</p>
        </div>
      } @else {
        <div class="table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Level</th>
                <th>XP</th>
                <th>Actions</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">{{ user.displayName?.charAt(0)?.toUpperCase() || '?' }}</div>
                      <div>
                        <div class="user-name">{{ user.displayName || 'Unknown' }}</div>
                        @if (user.email) {
                          <div class="user-email">{{ user.email }}</div>
                        }
                      </div>
                    </div>
                  </td>
                  <td>{{ user.level ?? '--' }}</td>
                  <td>{{ user.xp ?? '--' }}</td>
                  <td>{{ user.totalActions ?? '--' }}</td>
                  <td>{{ user.createdAt | date: 'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 24px;
      }

      .page-title {
        font-size: 24px;
        font-weight: 700;
        color: var(--theme-color-text-default);
        margin-bottom: 4px;
      }

      .page-subtitle {
        font-size: 14px;
        color: var(--theme-color-text-neutral-tertiary);
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

      .table-container {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 8px;
        overflow: hidden;
      }

      .users-table {
        width: 100%;
        border-collapse: collapse;
      }

      .users-table th {
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

      .users-table td {
        padding: 12px 16px;
        font-size: 14px;
        color: var(--theme-color-text-default);
        border-bottom: 1px solid var(--theme-color-border-default-default);
      }

      .users-table tr:last-child td {
        border-bottom: none;
      }

      .users-table tr:hover td {
        background: var(--theme-color-bg-neutral-secondary);
      }

      .user-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .user-avatar {
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

      .user-name {
        font-weight: 500;
        color: var(--theme-color-text-default);
      }

      .user-email {
        font-size: 12px;
        color: var(--theme-color-text-neutral-tertiary);
      }
    `,
  ],
})
export class UsersComponent implements OnInit {
  readonly #usersService = inject(UsersService);

  readonly users = signal<UserSummary[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.#usersService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load users. Please try again.');
        this.isLoading.set(false);
        console.error('Failed to load users:', err);
      },
    });
  }
}
