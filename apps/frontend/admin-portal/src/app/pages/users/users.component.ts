import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { UserDto } from '@codeheroes/types';
import { UsersService } from '../../core/services/users.service';

@Component({
  selector: 'admin-users',
  standalone: true,
  imports: [DatePipe, FormsModule, SuiButtonComponent],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Users</h1>
          @if (!isLoading() && !error()) {
            <p class="page-subtitle">
              @if (pageHistory().length > 0) {
                Page {{ pageHistory().length + 1 }}
              } @else {
                {{ users().length }}{{ hasMore() ? '+' : '' }} users
              }
            </p>
          }
        </div>
        <div class="search-container">
          <input
            class="search-input"
            type="text"
            placeholder="Search users..."
            [ngModel]="searchInput"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>
      </div>

      <div class="filters">
        <button class="filter-pill" [class.filter-pill--active]="userTypeFilter() === null" (click)="setUserTypeFilter(null)">All</button>
        <button class="filter-pill" [class.filter-pill--active]="userTypeFilter() === 'user'" (click)="setUserTypeFilter('user')">Users</button>
        <button class="filter-pill" [class.filter-pill--active]="userTypeFilter() === 'bot'" (click)="setUserTypeFilter('bot')">Bots</button>
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
          @if (searchTerm()) {
            <p>No users found matching "{{ searchTerm() }}".</p>
            <sui-button variant="outline" color="neutral" size="sm" (click)="clearSearch()">
              Clear search
            </sui-button>
          } @else {
            <p>No users found.</p>
          }
        </div>
      } @else {
        <div class="table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th class="sortable-header" tabindex="0" role="button" [attr.aria-sort]="sortBy() === 'name' ? (sortDirection() === 'asc' ? 'ascending' : 'descending') : null" (click)="toggleSort('name')" (keydown.enter)="toggleSort('name')" (keydown.space)="$event.preventDefault(); toggleSort('name')">
                  User
                  @if (sortBy() === 'name') {
                    <span class="sort-arrow">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                  }
                </th>
                <th>Type</th>
                <th class="sortable-header" tabindex="0" role="button" [attr.aria-sort]="sortBy() === 'createdAt' ? (sortDirection() === 'asc' ? 'ascending' : 'descending') : null" (click)="toggleSort('createdAt')" (keydown.enter)="toggleSort('createdAt')" (keydown.space)="$event.preventDefault(); toggleSort('createdAt')">
                  Joined
                  @if (sortBy() === 'createdAt') {
                    <span class="sort-arrow">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                  }
                </th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr class="clickable-row" [class.inactive-row]="!user.active" tabindex="0" role="link" (click)="openUser(user.id)" (keydown.enter)="openUser(user.id)" (keyup.space)="$event.preventDefault(); openUser(user.id)">
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">{{ (user.displayName || user.name)?.charAt(0)?.toUpperCase() || '?' }}</div>
                      <div>
                        <div class="user-name">
                          {{ user.displayName || user.name || 'Unknown' }}
                          @if (user.active === false) {
                            <span class="inactive-badge">Inactive</span>
                          }
                        </div>
                        @if (user.email && user.email !== user.displayName && user.email !== user.name) {
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

      .search-container {
        flex-shrink: 0;
      }

      .search-input {
        padding: 8px 12px;
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 6px;
        font-size: 14px;
        color: var(--theme-color-text-default);
        background: var(--theme-color-bg-surface-default);
        min-width: 240px;
        font-family: inherit;
      }

      .search-input:focus {
        outline: none;
        border-color: var(--theme-color-border-brand-default);
      }

      .search-input::placeholder {
        color: var(--theme-color-text-neutral-tertiary);
      }

      .loading-state,
      .empty-state {
        text-align: center;
        padding: 48px 0;
        color: var(--theme-color-text-neutral-tertiary);
        font-size: 14px;
      }

      .empty-state sui-button {
        margin-top: 12px;
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

      .inactive-row td {
        opacity: 0.6;
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

      .inactive-badge {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        background: var(--theme-color-feedback-bg-error-secondary);
        color: var(--theme-color-feedback-text-error-default);
        margin-left: 8px;
      }

      .sortable-header {
        cursor: pointer;
        user-select: none;
      }

      .sortable-header:hover {
        color: var(--theme-color-text-brand-default);
      }

      .sort-arrow {
        margin-left: 4px;
        font-size: 11px;
      }

      .filters {
        display: flex;
        gap: 4px;
        margin-bottom: 16px;
      }

      .filter-pill {
        padding: 6px 14px;
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 20px;
        background: var(--theme-color-bg-surface-default);
        color: var(--theme-color-text-neutral-tertiary);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s ease;
      }

      .filter-pill:hover {
        border-color: var(--theme-color-border-brand-default);
        color: var(--theme-color-text-default);
      }

      .filter-pill--active {
        background: var(--theme-color-bg-brand-default);
        border-color: var(--theme-color-bg-brand-default);
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
export class UsersComponent implements OnInit, OnDestroy {
  readonly #usersService = inject(UsersService);
  readonly #router = inject(Router);

  readonly users = signal<UserDto[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly hasMore = signal(false);
  readonly pageHistory = signal<string[]>([]);
  readonly sortBy = signal<string>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly searchTerm = signal<string>('');
  readonly userTypeFilter = signal<string | null>(null);

  searchInput = '';
  #searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  #currentLastId: string | null = null;
  readonly #pageSize = 25;

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    if (this.#searchDebounceTimer) {
      clearTimeout(this.#searchDebounceTimer);
    }
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const params: { limit: number; startAfterId?: string; sortBy?: string; sortDirection?: string; search?: string; userType?: string } = {
      limit: this.#pageSize,
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
    };
    if (this.#currentLastId) {
      params.startAfterId = this.#currentLastId;
    }
    if (this.searchTerm()) {
      params.search = this.searchTerm();
    }
    if (this.userTypeFilter()) {
      params.userType = this.userTypeFilter()!;
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

  onSearchChange(value: string): void {
    this.searchInput = value;
    if (this.#searchDebounceTimer) {
      clearTimeout(this.#searchDebounceTimer);
    }
    this.#searchDebounceTimer = setTimeout(() => {
      this.searchTerm.set(value.trim());
      this.#currentLastId = null;
      this.pageHistory.set([]);
      this.loadUsers();
    }, 300);
  }

  setUserTypeFilter(type: string | null): void {
    this.userTypeFilter.set(type);
    this.#currentLastId = null;
    this.pageHistory.set([]);
    this.loadUsers();
  }

  clearSearch(): void {
    this.searchInput = '';
    this.searchTerm.set('');
    this.#currentLastId = null;
    this.pageHistory.set([]);
    this.loadUsers();
  }

  toggleSort(field: string): void {
    if (this.sortBy() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDirection.set(field === 'name' ? 'asc' : 'desc');
    }
    // Reset pagination when sort changes
    this.#currentLastId = null;
    this.pageHistory.set([]);
    this.loadUsers();
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
