import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { AuthService } from '../core/services/auth.service';
import { UnmatchedEventsService } from '../core/services/unmatched-events.service';

@Component({
  selector: 'admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SuiButtonComponent],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="sidebar-logo">CH</span>
          <span class="sidebar-title">Code Heroes</span>
        </div>
        <nav class="sidebar-nav">
          <a
            routerLink="/home"
            routerLinkActive="nav-item--active"
            class="nav-item"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home
          </a>
          <a
            routerLink="/projects"
            routerLinkActive="nav-item--active"
            class="nav-item"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Projects
          </a>
          <a
            routerLink="/users"
            routerLinkActive="nav-item--active"
            class="nav-item"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Users
          </a>
          <a
            routerLink="/unmatched"
            routerLinkActive="nav-item--active"
            class="nav-item"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Unmatched
            @if (unmatchedCount() > 0) {
              <span class="nav-badge">{{ unmatchedCount() }}</span>
            }
          </a>
          <a
            routerLink="/leaderboard"
            routerLinkActive="nav-item--active"
            class="nav-item"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Leaderboard
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              {{ auth.currentUser()?.email?.charAt(0)?.toUpperCase() }}
            </div>
            <span class="user-email">{{ auth.currentUser()?.email }}</span>
          </div>
          <sui-button variant="ghost" color="neutral" size="sm" (click)="onSignOut()">
            Sign out
          </sui-button>
        </div>
      </aside>
      <main class="main-content">
        <div class="content-wrapper">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }

      .shell {
        display: flex;
        height: 100%;
      }

      .sidebar {
        width: 256px;
        min-width: 256px;
        background: var(--theme-color-bg-surface-default);
        border-right: 1px solid var(--theme-color-border-default-default);
        display: flex;
        flex-direction: column;
        height: 100vh;
        position: sticky;
        top: 0;
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 16px;
        border-bottom: 1px solid var(--theme-color-border-default-default);
      }

      .sidebar-logo {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: var(--theme-color-bg-brand-default);
        color: white;
        font-weight: 700;
        font-size: 14px;
      }

      .sidebar-title {
        font-weight: 600;
        font-size: 16px;
        color: var(--theme-color-text-default);
      }

      .sidebar-nav {
        flex: 1;
        padding: 12px 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 6px;
        color: var(--theme-color-text-neutral-tertiary);
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.15s ease;
      }

      .nav-item:hover {
        background: var(--theme-color-bg-neutral-secondary);
        color: var(--theme-color-text-default);
      }

      .nav-item--active {
        background: var(--theme-color-bg-brand-secondary);
        color: var(--theme-color-text-brand-default);
      }

      .nav-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .nav-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 9px;
        background: var(--theme-color-bg-brand-default);
        color: white;
        font-size: 11px;
        font-weight: 600;
        margin-left: auto;
      }

      .sidebar-footer {
        padding: 12px 16px;
        border-top: 1px solid var(--theme-color-border-default-default);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .user-info {
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

      .user-email {
        font-size: 13px;
        color: var(--theme-color-text-neutral-tertiary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .main-content {
        flex: 1;
        overflow-y: auto;
        background: var(--theme-color-bg-neutral-secondary);
        padding: 32px 48px;
      }

      .content-wrapper {
        max-width: 1200px;
      }
    `,
  ],
})
export class ShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly #router = inject(Router);
  readonly #unmatchedEventsService = inject(UnmatchedEventsService);

  readonly unmatchedCount = this.#unmatchedEventsService.pendingCount;

  ngOnInit(): void {
    this.#unmatchedEventsService.getSummary().subscribe({
      error: () => {},
    });
  }

  async onSignOut(): Promise<void> {
    await this.auth.signOut();
    await this.#router.navigate(['/login']);
  }
}
