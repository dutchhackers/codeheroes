import { Component, input, output } from '@angular/core';
import { ProjectSummaryDto } from '@codeheroes/types';

@Component({
  selector: 'admin-project-card',
  standalone: true,
  imports: [],
  template: `
    <div class="card" (click)="viewClick.emit()">
      <div class="card-top">
        <div class="card-icon">{{ project().name.charAt(0).toUpperCase() }}</div>
      </div>
      <h3 class="card-title">{{ project().name }}</h3>
      <p class="card-subtitle">
        {{ project().activeMemberCount }} member{{ project().activeMemberCount !== 1 ? 's' : '' }} &middot; {{ project().repositoryCount }} repo{{ project().repositoryCount !== 1 ? 's' : '' }}
      </p>
      <button type="button" class="card-view-link" (click)="viewClick.emit()">
        View details
        <span class="arrow">&rarr;</span>
      </button>
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
        display: flex;
        flex-direction: column;
        cursor: pointer;
      }

      .card:hover {
        box-shadow: var(--theme-effect-styles-drop-shadow-200);
      }

      .card-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .card-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: var(--theme-color-bg-brand-default);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 18px;
        flex-shrink: 0;
      }

      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--theme-color-text-default);
        margin-bottom: 4px;
      }

      .card-subtitle {
        font-size: 13px;
        color: var(--theme-color-text-neutral-tertiary);
        margin-bottom: 20px;
        flex: 1;
      }

      .card-view-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        font-weight: 500;
        color: var(--theme-color-text-brand-default);
        text-decoration: none;
        cursor: pointer;
      }

      .card-view-link:hover {
        text-decoration: underline;
      }

      .arrow {
        font-size: 16px;
        transition: transform 0.15s ease;
      }

      .card-view-link:hover .arrow {
        transform: translateX(2px);
      }
    `,
  ],
})
export class ProjectCardComponent {
  readonly project = input.required<ProjectSummaryDto>();
  readonly viewClick = output<void>();
}
