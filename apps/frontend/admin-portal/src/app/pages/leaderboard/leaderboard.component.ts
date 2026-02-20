import { Component, OnInit, inject, signal } from '@angular/core';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { DashboardService, LeaderboardEntry } from '../../core/services/dashboard.service';

@Component({
  selector: 'admin-leaderboard',
  standalone: true,
  imports: [SuiButtonComponent],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Weekly Leaderboard</h1>
          @if (!isLoading() && !error()) {
            <p class="page-subtitle">{{ entries().length }} participants this week</p>
          }
        </div>
      </div>

      <div class="filters">
        <div class="filter-group">
          <button class="filter-pill" [class.filter-pill--active]="userTypeFilter() === null" (click)="setUserTypeFilter(null)">All</button>
          <button class="filter-pill" [class.filter-pill--active]="userTypeFilter() === 'user'" (click)="setUserTypeFilter('user')">Users</button>
          <button class="filter-pill" [class.filter-pill--active]="userTypeFilter() === 'bot'" (click)="setUserTypeFilter('bot')">Bots</button>
        </div>
        <label class="toggle-label">
          <input type="checkbox" [checked]="showZeroXp()" (change)="toggleShowZeroXp()" />
          Show zero-XP participants
        </label>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <p>Loading leaderboard...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <sui-button variant="outline" color="neutral" size="sm" (click)="loadLeaderboard()">
            Try again
          </sui-button>
        </div>
      } @else if (entries().length === 0) {
        <div class="empty-state">
          <p>No leaderboard data for this week yet.</p>
        </div>
      } @else {
        <div class="table-container">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Level</th>
                <th>XP This Week</th>
                <th>Total XP</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of entries(); track entry.userId; let i = $index) {
                <tr>
                  <td class="rank-cell">{{ i + 1 }}</td>
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">{{ entry.displayName.charAt(0).toUpperCase() || '?' }}</div>
                      <span class="user-name">{{ entry.displayName }}</span>
                    </div>
                  </td>
                  <td>{{ entry.level }}</td>
                  <td class="xp-cell">+{{ entry.xpGained.toLocaleString() }}</td>
                  <td>{{ entry.totalXp.toLocaleString() }}</td>
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

      .leaderboard-table {
        width: 100%;
        border-collapse: collapse;
      }

      .leaderboard-table th {
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

      .leaderboard-table td {
        padding: 12px 16px;
        font-size: 14px;
        color: var(--theme-color-text-default);
        border-bottom: 1px solid var(--theme-color-border-default-default);
      }

      .leaderboard-table tr:last-child td {
        border-bottom: none;
      }

      .leaderboard-table tr:hover td {
        background: var(--theme-color-bg-neutral-secondary);
      }

      .rank-cell {
        font-weight: 600;
        color: var(--theme-color-text-neutral-tertiary);
        width: 48px;
      }

      .user-cell {
        display: flex;
        align-items: center;
        gap: 10px;
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
      }

      .xp-cell {
        color: var(--theme-color-text-brand-default);
        font-weight: 600;
      }

      .filters {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        gap: 16px;
      }

      .filter-group {
        display: flex;
        gap: 4px;
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

      .toggle-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--theme-color-text-neutral-tertiary);
        cursor: pointer;
        user-select: none;
      }

      .toggle-label input[type="checkbox"] {
        accent-color: var(--theme-color-bg-brand-default);
        cursor: pointer;
      }
    `,
  ],
})
export class LeaderboardComponent implements OnInit {
  readonly #dashboardService = inject(DashboardService);

  readonly entries = signal<LeaderboardEntry[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showZeroXp = signal(false);
  readonly userTypeFilter = signal<string | null>(null);

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const params: { includeZeroXp?: boolean; userType?: string } = {
      includeZeroXp: this.showZeroXp(),
    };
    if (this.userTypeFilter()) {
      params.userType = this.userTypeFilter()!;
    }

    this.#dashboardService.getWeeklyLeaderboard(params).subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load leaderboard. Please try again.');
        this.isLoading.set(false);
        console.error('Failed to load leaderboard:', err);
      },
    });
  }

  toggleShowZeroXp(): void {
    this.showZeroXp.update((v) => !v);
    this.loadLeaderboard();
  }

  setUserTypeFilter(type: string | null): void {
    this.userTypeFilter.set(type);
    this.loadLeaderboard();
  }
}
