import { Component, input, output } from '@angular/core';

export type Period = 'day' | 'week';

@Component({
  selector: 'app-period-toggle',
  standalone: true,
  template: `
    <div class="period-toggle" role="group" aria-label="Time period selection">
      <button
        type="button"
        class="toggle-button"
        [class.active]="selectedPeriod() === 'day'"
        (click)="onPeriodChange('day')"
        [attr.aria-pressed]="selectedPeriod() === 'day'"
      >
        Today
      </button>
      <button
        type="button"
        class="toggle-button"
        [class.active]="selectedPeriod() === 'week'"
        (click)="onPeriodChange('week')"
        [attr.aria-pressed]="selectedPeriod() === 'week'"
      >
        This Week
      </button>
    </div>
  `,
  styles: [
    `
      .period-toggle {
        display: inline-flex;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 0.25rem;
        gap: 0.25rem;
      }

      .toggle-button {
        padding: 0.5rem 1rem;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .toggle-button:hover {
        color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.05);
      }

      .toggle-button.active {
        background: var(--neon-cyan);
        color: #000;
        box-shadow: 0 0 12px color-mix(in srgb, var(--neon-cyan) 50%, transparent);
      }

      .toggle-button:focus-visible {
        outline: 2px solid var(--neon-cyan);
        outline-offset: 2px;
      }

      @media (max-width: 480px) {
        .toggle-button {
          padding: 0.5rem 0.75rem;
          font-size: 0.8rem;
        }
      }
    `,
  ],
})
export class PeriodToggleComponent {
  selectedPeriod = input<Period>('week');
  periodChange = output<Period>();

  onPeriodChange(period: Period) {
    this.periodChange.emit(period);
  }
}
