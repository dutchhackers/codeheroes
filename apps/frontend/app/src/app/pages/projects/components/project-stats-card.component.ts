import { Component, input } from '@angular/core';

@Component({
  selector: 'app-project-stats-card',
  standalone: true,
  template: `
    <div class="stat-card">
      <span [class]="'stat-value ' + colorClass()">{{ value() }}</span>
      <span class="stat-label">{{ label() }}</span>
    </div>
  `,
  styles: [
    `
      .stat-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1;
      }

      .stat-label {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      @media (min-width: 768px) {
        .stat-value {
          font-size: 1.75rem;
        }

        .stat-label {
          font-size: 0.8rem;
        }
      }
    `,
  ],
})
export class ProjectStatsCardComponent {
  value = input.required<string>();
  label = input.required<string>();
  colorClass = input<string>('text-white');
}
