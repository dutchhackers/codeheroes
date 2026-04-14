import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { InstallationSummaryDto } from '@codeheroes/types';
import { forkJoin } from 'rxjs';
import { InstallationsService } from '../../core/services/installations.service';
import { UsersService } from '../../core/services/users.service';

@Component({
  selector: 'admin-installations',
  standalone: true,
  imports: [DatePipe, RouterLink, SuiButtonComponent],
  template: `
    <div>
      <h1 class="page-title">Installations</h1>
      <p class="page-subtitle">
        @if (!isLoading() && !error()) {
          {{ filteredInstallations().length }} installation{{ filteredInstallations().length !== 1 ? 's' : '' }}
          · {{ totalRepoCount() }} linked repositories
        } @else {
          GitHub App installations overview
        }
      </p>

      @if (isLoading()) {
        <div class="table-container">
          <div class="skeleton-table">
            @for (_ of [1, 2, 3, 4, 5]; track $index) {
              <div class="skeleton-row">
                <div class="skeleton skeleton-avatar-ph"></div>
                <div class="skeleton skeleton-name"></div>
                <div class="skeleton skeleton-badge"></div>
                <div class="skeleton skeleton-number"></div>
                <div class="skeleton skeleton-name"></div>
                <div class="skeleton skeleton-date"></div>
              </div>
            }
          </div>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <sui-button variant="outline" color="neutral" size="sm" (click)="load()">
            Try again
          </sui-button>
        </div>
      } @else {
        <div class="toolbar">
          <input
            class="search-input"
            type="text"
            placeholder="Search account or repository..."
            [value]="searchTerm()"
            (input)="onSearch($event)"
          />
          @if (hasMultipleStatuses()) {
          <div class="filter-pills">
            @for (f of statusFilters(); track f.value) {
              <button
                class="filter-pill"
                [class.filter-pill--active]="statusFilter() === f.value"
                (click)="statusFilter.set(f.value)"
              >
                {{ f.label }}
              </button>
            }
          </div>
          }
        </div>

        @if (filteredInstallations().length === 0) {
          <div class="empty-state">
            <p>No installations found.</p>
          </div>
        } @else {
          <div class="table-container">
            <table class="installations-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Repositories</th>
                  <th>Status</th>
                  <th>Linked User</th>
                  <th>Linked At</th>
                </tr>
              </thead>
              <tbody>
                @for (inst of filteredInstallations(); track inst.id) {
                  <tr class="clickable-row" (click)="toggleExpanded(inst.id)">
                    <td>
                      <div class="account-cell">
                        <div class="account-avatar">{{ inst.accountLogin.charAt(0).toUpperCase() }}</div>
                        <span class="account-login">{{ inst.accountLogin }}</span>
                        <span class="type-badge">{{ inst.accountType }}</span>
                      </div>
                    </td>
                    <td>
                      @if (inst.repositorySelection === 'all') {
                        <span class="repo-all-badge">All repositories</span>
                      } @else {
                        <span>{{ inst.repositoryCount }}</span>
                        @if (inst.repositories.length > 0) {
                          <span class="repo-preview">
                            — {{ repoPreview(inst) }}
                          </span>
                        }
                      }
                    </td>
                    <td>
                      <span class="status-badge status-{{ inst.status }}">{{ inst.status }}</span>
                    </td>
                    <td>
                      @if (inst.linkedUserId) {
                        <a class="user-link" [routerLink]="['/users', inst.linkedUserId]" (click)="$event.stopPropagation()">
                          {{ userNameMap()[inst.linkedUserId] || inst.linkedUserId }}
                        </a>
                      } @else {
                        <span class="unlinked">Unlinked</span>
                      }
                    </td>
                    <td>
                      @if (inst.linkedAt) {
                        {{ inst.linkedAt | date: 'mediumDate' }}
                      } @else {
                        —
                      }
                    </td>
                  </tr>
                  @if (expandedId() === inst.id && inst.repositorySelection !== 'all' && inst.repositories.length > 0) {
                    <tr class="expanded-row">
                      <td colspan="5">
                        <div class="repo-list">
                          @for (repo of inst.repositories; track repo.id) {
                            <div class="repo-item">
                              <span class="repo-name">{{ repo.fullName }}</span>
                              <span class="visibility-badge" [class.visibility-private]="repo.private">
                                {{ repo.private ? 'private' : 'public' }}
                              </span>
                            </div>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .page-title {
        font-size: 24px;
        font-weight: 700;
        color: var(--theme-color-text-default);
        margin-bottom: 4px;
      }

      .page-subtitle {
        font-size: 14px;
        color: var(--theme-color-text-neutral-tertiary);
        margin-bottom: 24px;
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .search-input {
        flex: 1;
        min-width: 200px;
        max-width: 320px;
        padding: 8px 12px;
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 6px;
        font-size: 14px;
        color: var(--theme-color-text-default);
        background: var(--theme-color-bg-surface-default);
      }

      .search-input:focus {
        outline: none;
        border-color: var(--theme-color-border-brand-default);
      }

      .search-input::placeholder {
        color: var(--theme-color-text-neutral-tertiary);
      }

      .filter-pills {
        display: flex;
        gap: 4px;
      }

      .filter-pill {
        padding: 4px 12px;
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 16px;
        font-size: 13px;
        font-weight: 500;
        color: var(--theme-color-text-neutral-tertiary);
        background: transparent;
        cursor: pointer;
        transition: all 0.15s ease;
        font-family: inherit;
      }

      .filter-pill:hover {
        color: var(--theme-color-text-default);
        background: var(--theme-color-bg-neutral-secondary);
      }

      .filter-pill--active {
        background: var(--theme-color-bg-brand-secondary);
        color: var(--theme-color-text-brand-default);
        border-color: var(--theme-color-border-brand-default);
      }

      .table-container {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 8px;
        overflow: hidden;
      }

      .installations-table {
        width: 100%;
        border-collapse: collapse;
      }

      .installations-table th {
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

      .installations-table td {
        padding: 12px 16px;
        font-size: 14px;
        color: var(--theme-color-text-default);
        border-bottom: 1px solid var(--theme-color-border-default-default);
      }

      .installations-table tr:last-child td {
        border-bottom: none;
      }

      .clickable-row {
        cursor: pointer;
      }

      .clickable-row:hover td {
        background: var(--theme-color-bg-neutral-secondary);
      }

      .account-cell {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .account-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--theme-color-bg-neutral-secondary);
        color: var(--theme-color-text-brand-default);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 12px;
        flex-shrink: 0;
      }

      .account-login {
        font-weight: 500;
      }

      .type-badge {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        background: var(--theme-color-bg-neutral-secondary);
        color: var(--theme-color-text-neutral-secondary);
      }

      .status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        text-transform: capitalize;
      }

      .status-active {
        background: var(--theme-color-feedback-bg-success-secondary, var(--theme-color-bg-brand-secondary));
        color: var(--theme-color-feedback-text-success-default, var(--theme-color-text-brand-default));
      }

      .status-suspended {
        background: var(--theme-color-feedback-bg-warning-secondary, #fef3c7);
        color: var(--theme-color-feedback-text-warning-default, #92400e);
      }

      .status-deleted {
        background: var(--theme-color-feedback-bg-error-secondary);
        color: var(--theme-color-feedback-text-error-default);
      }

      .repo-all-badge {
        font-style: italic;
        color: var(--theme-color-text-neutral-tertiary);
      }

      .repo-preview {
        font-size: 13px;
        color: var(--theme-color-text-neutral-tertiary);
      }

      .user-link {
        color: var(--theme-color-text-brand-default);
        text-decoration: none;
        font-weight: 500;
      }

      .user-link:hover {
        text-decoration: underline;
      }

      .unlinked {
        color: var(--theme-color-text-neutral-tertiary);
        font-style: italic;
      }

      .expanded-row td {
        padding: 0 16px 16px;
        background: var(--theme-color-bg-neutral-secondary);
      }

      .repo-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 12px 0 0 38px;
      }

      .repo-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      }

      .repo-name {
        font-family: monospace;
        font-size: 13px;
        color: var(--theme-color-text-default);
      }

      .visibility-badge {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        background: var(--theme-color-bg-neutral-secondary);
        color: var(--theme-color-text-neutral-secondary);
      }

      .visibility-private {
        background: var(--theme-color-feedback-bg-warning-secondary, #fef3c7);
        color: var(--theme-color-feedback-text-warning-default, #92400e);
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

      /* Skeleton loader */
      @keyframes shimmer {
        0% { opacity: 1; }
        50% { opacity: 0.4; }
        100% { opacity: 1; }
      }

      .skeleton {
        background: var(--theme-color-bg-neutral-secondary);
        border-radius: 4px;
        animation: shimmer 1.5s ease-in-out infinite;
      }

      .skeleton-table {
        padding: 12px 0;
      }

      .skeleton-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
      }

      .skeleton-avatar-ph {
        height: 28px;
        width: 28px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .skeleton-name {
        height: 16px;
        width: 120px;
        flex-shrink: 0;
      }

      .skeleton-badge {
        height: 16px;
        width: 48px;
        flex-shrink: 0;
      }

      .skeleton-number {
        height: 16px;
        width: 36px;
        flex-shrink: 0;
      }

      .skeleton-date {
        height: 16px;
        width: 80px;
        flex-shrink: 0;
        margin-left: auto;
      }
    `,
  ],
})
export class InstallationsComponent implements OnInit {
  readonly #installationsService = inject(InstallationsService);
  readonly #usersService = inject(UsersService);

  readonly installations = signal<InstallationSummaryDto[]>([]);
  readonly userNameMap = signal<Record<string, string>>({});
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly statusFilter = signal<string | null>(null);
  readonly expandedId = signal<string | null>(null);

  readonly hasMultipleStatuses = computed(() => {
    const statuses = new Set(this.installations().map((i) => i.status));
    return statuses.size > 1;
  });

  readonly statusFilters = computed(() => {
    const statuses = new Set(this.installations().map((i) => i.status));
    const filters: { label: string; value: string | null }[] = [{ label: 'All', value: null }];
    if (statuses.has('active')) filters.push({ label: 'Active', value: 'active' });
    if (statuses.has('suspended')) filters.push({ label: 'Suspended', value: 'suspended' });
    if (statuses.has('deleted')) filters.push({ label: 'Deleted', value: 'deleted' });
    return filters;
  });

  readonly filteredInstallations = computed(() => {
    let list = this.installations();
    const status = this.statusFilter();
    const search = this.searchTerm().toLowerCase().trim();

    if (status) {
      list = list.filter((i) => i.status === status);
    }

    if (search) {
      list = list.filter(
        (i) =>
          i.accountLogin.toLowerCase().includes(search) ||
          i.repositories.some((r) => r.fullName.toLowerCase().includes(search)),
      );
    }

    return list;
  });

  readonly totalRepoCount = computed(() =>
    this.installations().reduce((sum, i) => sum + i.repositoryCount, 0),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      installations: this.#installationsService.getAllInstallations(),
      users: this.#usersService.getUsers({ limit: 200 }),
    }).subscribe({
      next: ({ installations, users }) => {
        this.installations.set(installations);
        const nameMap: Record<string, string> = {};
        for (const u of users.items) {
          nameMap[u.id] = u.displayName || u.name || u.email || u.id;
        }
        this.userNameMap.set(nameMap);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load installations.');
        this.isLoading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  toggleExpanded(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  repoPreview(inst: InstallationSummaryDto): string {
    const repos = inst.repositories;
    if (repos.length <= 3) {
      return repos.map((r) => r.name).join(', ');
    }
    return repos.slice(0, 2).map((r) => r.name).join(', ') + ` +${repos.length - 2} more`;
  }
}
