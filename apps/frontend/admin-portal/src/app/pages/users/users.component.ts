import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { UserDto } from '@codeheroes/types';
import { UsersService } from '../../core/services/users.service';

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
            <p class="page-subtitle">Showing {{ users().length }} users</p>
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
                <th>Type</th>
                <th>Last Login</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr class="clickable-row" tabindex="0" role="link" (click)="openUser(user.id)" (keydown.enter)="openUser(user.id)" (keydown.space)="openUser(user.id)">
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
                  <td>
                    <span class="user-type-badge" [class.user-type-bot]="user.userType !== 'user'">
                      {{ user.userType }}
                    </span>
                  </td>
                  <td>{{ user.lastLogin | date: 'mediumDate' }}</td>
                  <td>{{ user.createdAt | date: 'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination-controls">
          <sui-button
            variant="outline"
            color="neutral"
            size="sm"
            [disabled]="pageHistory().length === 0"
            (click)="previousPage()"
          >
            Previous
          </sui-button>
          <sui-button
            variant="outline"
            color="neutral"
            size="sm"
            [disabled]="!hasMore()"
            (click)="nextPage()"
          >
            Next
          </sui-button>
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

      .clickable-row {
        cursor: pointer;
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

      .user-type-badge {
        display: inline-block;
        padding: 2px 8px;
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

      .pagination-controls {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
      }
    `,
  ],
})
export class UsersComponent implements OnInit {
  readonly #usersService = inject(UsersService);
  readonly #router = inject(Router);

  readonly users = signal<UserDto[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly hasMore = signal(false);
  readonly pageHistory = signal<string[]>([]);

  #currentLastId: string | null = null;
  readonly #pageSize = 25;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const params: { limit: number; startAfterId?: string } = { limit: this.#pageSize };
    if (this.#currentLastId) {
      params.startAfterId = this.#currentLastId;
    }

    this.#usersService.getUsers(params).subscribe({
      next: (response) => {
        this.users.set(response.items);
        this.hasMore.set(response.hasMore);
        this.#currentLastId = response.lastId;
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load users. Please try again.');
        this.isLoading.set(false);
        console.error('Failed to load users:', err);
      },
    });
  }

  nextPage(): void {
    if (!this.hasMore() || !this.#currentLastId) return;
    this.pageHistory.update((history) => [...history, this.#currentLastId!]);
    this.loadUsers();
  }

  openUser(id: string): void {
    this.#router.navigate(['/users', id]);
  }

  previousPage(): void {
    const history = this.pageHistory();
    if (history.length === 0) return;

    const newHistory = [...history];
    newHistory.pop();
    this.pageHistory.set(newHistory);

    this.#currentLastId = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
    this.loadUsers();
  }
}
