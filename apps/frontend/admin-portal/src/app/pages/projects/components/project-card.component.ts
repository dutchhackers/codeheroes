import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SuiBadgeComponent } from '@move4mobile/stride-ui';
import { ProjectSummaryDto } from '@codeheroes/types';

@Component({
  selector: 'admin-project-card',
  standalone: true,
  imports: [DecimalPipe, SuiBadgeComponent],
  template: `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">{{ project().name }}</h3>
        <sui-badge variant="soft" color="neutral" [compact]="true">{{ project().slug }}</sui-badge>
      </div>
      @if (project().description) {
        <p class="card-description">{{ project().description }}</p>
      }
      <div class="stats-grid">
        <div class="stat">
          <span class="stat-label">Repos</span>
          <span class="stat-value">{{ project().repositoryCount }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">XP</span>
          <span class="stat-value">{{ project().totalXp | number }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Actions</span>
          <span class="stat-value">{{ project().totalActions | number }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Members</span>
          <span class="stat-value">{{ project().activeMemberCount }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 8px;
        padding: 20px;
        transition: box-shadow 0.15s ease;
      }

      .card:hover {
        box-shadow: var(--theme-effect-styles-drop-shadow-200);
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }

      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--theme-color-text-default);
      }

      .card-description {
        font-size: 14px;
        color: var(--theme-color-text-neutral-tertiary);
        margin-bottom: 16px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .stat {
        background: var(--theme-color-bg-neutral-secondary);
        border-radius: 6px;
        padding: 10px 12px;
      }

      .stat-label {
        display: block;
        font-size: 12px;
        color: var(--theme-color-text-neutral-tertiary);
        margin-bottom: 2px;
      }

      .stat-value {
        display: block;
        font-size: 18px;
        font-weight: 700;
        color: var(--theme-color-text-default);
      }
    `,
  ],
})
export class ProjectCardComponent {
  readonly project = input.required<ProjectSummaryDto>();
}
