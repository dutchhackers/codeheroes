import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProjectsService } from '../../core/services/projects.service';
import { DashboardService, LeaderboardEntry } from '../../core/services/dashboard.service';
import { UnmatchedEventsService } from '../../core/services/unmatched-events.service';

@Component({
  selector: 'admin-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div>
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome to the Code Heroes admin portal.</p>

      @if (isLoading()) {
        <!-- Skeleton: stat cards -->
        <div class="stats-grid">
          @for (_ of [1, 2, 3, 4, 5]; track $index) {
            <div class="stat-card">
              <div class="skeleton skeleton-label"></div>
              <div class="skeleton skeleton-value"></div>
            </div>
          }
        </div>

        <!-- Skeleton: leaderboard -->
        <div class="section-header" style="margin-top: 32px">
          <div class="skeleton skeleton-section-title"></div>
        </div>
        <div class="table-container">
          <div class="skeleton-table">
            @for (_ of [1, 2, 3, 4, 5]; track $index) {
              <div class="skeleton-row">
                <div class="skeleton skeleton-rank"></div>
                <div class="skeleton skeleton-avatar-ph"></div>
                <div class="skeleton skeleton-name"></div>
                <div class="skeleton skeleton-number"></div>
                <div class="skeleton skeleton-number"></div>
                <div class="skeleton skeleton-number"></div>
              </div>
            }
          </div>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
        </div>
      } @else {
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Projects</span>
            <span class="stat-value">{{ projectCount() }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Users</span>
            <span class="stat-value">{{ userCountLabel() }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total XP (all projects)</span>
            <span class="stat-value">{{ formatNumber(totalXp()) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Actions (all projects)</span>
            <span class="stat-value">{{ formatNumber(totalActions()) }}</span>
          </div>
          <a class="stat-card stat-card--link" routerLink="/unmatched">
            <span class="stat-label">Unmatched Events</span>
            <span class="stat-value">{{ unmatchedCount() }}</span>
          </a>
        </div>

        @if (leaderboardTop().length > 0) {
          <div class="section-header">
            <h2 class="section-title">Weekly Leaderboard</h2>
            <a class="view-all-link" routerLink="/leaderboard">View all</a>
          </div>
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
                @for (entry of leaderboardTop(); track entry.userId; let i = $index) {
                  <tr>
                    <td class="rank-cell">{{ i + 1 }}</td>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar">{{ entry.displayName.charAt(0).toUpperCase() || '?' }}</div>
                        <span class="user-name">{{ entry.displayName }}</span>
                      </div>
                    </td>
                    <td>{{ entry.level }}</td>
                    <td class="xp-cell">+{{ formatNumber(entry.xpGained) }}</td>
                    <td>{{ formatNumber(entry.totalXp) }}</td>
                  </tr>
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
        margin-bottom: 32px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
      }

      .stat-card {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 8px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .stat-card--link {
        text-decoration: none;
        cursor: pointer;
        transition: box-shadow 0.15s ease;
      }

      .stat-card--link:hover {
        box-shadow: var(--theme-effect-styles-drop-shadow-200);
      }

      .stat-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--theme-color-text-neutral-tertiary);
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--theme-color-text-default);
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 32px;
        margin-bottom: 16px;
      }

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--theme-color-text-default);
      }

      .view-all-link {
        font-size: 14px;
        font-weight: 500;
        color: var(--theme-color-text-brand-default);
        text-decoration: none;
      }

      .view-all-link:hover {
        text-decoration: underline;
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

      .user-name {
        font-weight: 500;
      }

      .xp-cell {
        color: var(--theme-color-text-brand-default);
        font-weight: 600;
      }

      .error-state {
        background: var(--theme-color-feedback-bg-error-secondary);
        border: 1px solid var(--theme-color-feedback-border-error-default);
        border-radius: 8px;
        padding: 16px;
        color: var(--theme-color-feedback-text-error-default);
        font-size: 14px;
        margin-top: 24px;
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

      .skeleton-label {
        height: 14px;
        width: 80px;
      }

      .skeleton-value {
        height: 32px;
        width: 64px;
      }

      .skeleton-section-title {
        height: 20px;
        width: 180px;
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

      .skeleton-rank {
        height: 16px;
        width: 24px;
        flex-shrink: 0;
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

      .skeleton-number {
        height: 16px;
        width: 48px;
        flex-shrink: 0;
        margin-left: auto;
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  readonly #projectsService = inject(ProjectsService);
  readonly #dashboardService = inject(DashboardService);
  readonly #unmatchedEventsService = inject(UnmatchedEventsService);

  readonly projectCount = signal(0);
  readonly userCountLabel = signal('0');
  readonly totalXp = signal(0);
  readonly totalActions = signal(0);
  readonly unmatchedCount = signal(0);
  readonly leaderboard = signal<LeaderboardEntry[]>([]);
  readonly leaderboardTop = computed(() => this.leaderboard().slice(0, 5));
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    forkJoin({
      projects: this.#projectsService.getProjects(),
      leaderboard: this.#dashboardService.getWeeklyLeaderboard(),
      unmatched: this.#unmatchedEventsService.getSummary(),
    }).subscribe({
      next: ({ projects, leaderboard, unmatched }) => {
        this.projectCount.set(projects.length);
        this.totalXp.set(projects.reduce((sum, p) => sum + p.totalXp, 0));
        this.totalActions.set(projects.reduce((sum, p) => sum + p.totalActions, 0));
        this.userCountLabel.set(String(leaderboard.length));
        this.leaderboard.set(leaderboard);
        this.unmatchedCount.set(unmatched.unknownUserCount + unmatched.unlinkedRepoCount);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load dashboard data.');
        this.isLoading.set(false);
        console.error('Dashboard load error:', err);
      },
    });
  }

  formatNumber(value: number | string): string {
    if (typeof value === 'string') return value;
    return value.toLocaleString();
  }
}
