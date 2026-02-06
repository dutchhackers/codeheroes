import { Component, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { ProjectSummaryDto } from '@codeheroes/types';

@Component({
  selector: 'admin-edit-project-modal',
  standalone: true,
  imports: [FormsModule, SuiButtonComponent],
  template: `
    <div class="overlay" (click)="onOverlayClick($event)">
      <div class="modal">
        <div class="modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
        <h2 class="modal-title">Edit project</h2>
        <p class="modal-subtitle">Modify the project's details below</p>

        <label class="field-label" for="projectName">Name of project</label>
        <input
          id="projectName"
          class="field-input"
          type="text"
          [(ngModel)]="name"
          (keydown.enter)="onSave()"
        />

        <div class="modal-actions">
          <sui-button variant="ghost" color="neutral" size="sm" (click)="cancel.emit()">
            Cancel
          </sui-button>
          <sui-button
            variant="solid"
            color="brand"
            size="sm"
            [disabled]="isSaving() || !name.trim() || name.trim() === project().name"
            (click)="onSave()"
          >
            {{ isSaving() ? 'Saving...' : 'Save' }}
          </sui-button>
        </div>

        @if (errorMessage()) {
          <p class="error-text">{{ errorMessage() }}</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal {
        background: var(--theme-color-bg-surface-default);
        border-radius: 12px;
        padding: 24px;
        width: 100%;
        max-width: 440px;
        box-shadow: var(--theme-effect-styles-drop-shadow-200);
      }

      .modal-icon {
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
        margin-bottom: 16px;
      }

      .modal-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--theme-color-text-default);
        margin-bottom: 4px;
      }

      .modal-subtitle {
        font-size: 14px;
        color: var(--theme-color-text-neutral-tertiary);
        margin-bottom: 20px;
      }

      .field-label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: var(--theme-color-text-default);
        margin-bottom: 6px;
      }

      .field-input {
        width: 100%;
        padding: 10px 12px;
        font-size: 14px;
        font-family: var(--theme-font-family-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 6px;
        background: var(--theme-color-bg-surface-default);
        color: var(--theme-color-text-default);
        outline: none;
        transition: border-color 0.15s ease;
        box-sizing: border-box;
      }

      .field-input:focus {
        border-color: var(--theme-color-border-brand-default);
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
      }

      .error-text {
        font-size: 13px;
        color: var(--theme-color-feedback-text-error-default);
        margin-top: 12px;
      }
    `,
  ],
})
export class EditProjectModalComponent implements OnInit {
  readonly project = input.required<ProjectSummaryDto>();
  readonly cancel = output<void>();
  readonly save = output<string>();

  name = '';
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.name = this.project().name;
  }

  onSave(): void {
    const trimmed = this.name.trim();
    if (!trimmed || trimmed === this.project().name) return;
    this.save.emit(trimmed);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.cancel.emit();
    }
  }
}
