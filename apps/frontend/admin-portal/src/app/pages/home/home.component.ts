import { Component } from '@angular/core';

@Component({
  selector: 'admin-home',
  standalone: true,
  template: `
    <div>
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome to the Code Heroes admin portal.</p>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Projects</span>
          <span class="stat-value">--</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Users</span>
          <span class="stat-value">--</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Total XP</span>
          <span class="stat-value">--</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Actions (7d)</span>
          <span class="stat-value">--</span>
        </div>
      </div>
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
    `,
  ],
})
export class HomeComponent {}
