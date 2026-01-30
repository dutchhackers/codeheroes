import {
  Component,
  input,
  output,
  signal,
  computed,
  ElementRef,
  viewChild,
  AfterViewInit,
} from '@angular/core';

@Component({
  selector: 'app-profile-edit-modal',
  standalone: true,
  template: `
    <div
      class="modal-backdrop"
      (click)="onBackdropClick($event)"
      (keydown.escape)="onCancel()"
      (keydown)="onBackdropKeydown($event)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-title" class="modal-title">Edit Profile</h2>
          <button
            type="button"
            class="close-button"
            (click)="onCancel()"
            aria-label="Close dialog"
            [disabled]="isSaving()"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <label class="input-label" for="displayName">Nickname</label>
          <input
            #displayNameInput
            type="text"
            id="displayName"
            class="input-field"
            [class.input-error]="hasError()"
            [value]="inputValue()"
            (input)="onInputChange($event)"
            (keydown.enter)="onSave()"
            [disabled]="isSaving()"
            maxlength="50"
            autocomplete="off"
          />
          <div class="input-hint" [class.error-text]="hasError()">
            @if (hasError()) {
              {{ errorMessage() }}
            } @else {
              2-50 characters
            }
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="onCancel()"
            [disabled]="isSaving()"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="onSave()"
            [disabled]="!canSave() || isSaving()"
          >
            @if (isSaving()) {
              <span class="saving-spinner"></span>
              Saving...
            } @else {
              Save
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 1rem;
      }

      .modal-content {
        background: linear-gradient(
          135deg,
          rgba(20, 20, 30, 0.98),
          rgba(30, 20, 40, 0.98)
        );
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 12px;
        width: 100%;
        max-width: 400px;
        box-shadow:
          0 0 30px rgba(139, 92, 246, 0.2),
          0 0 60px rgba(6, 182, 212, 0.1);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .modal-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: white;
        margin: 0;
      }

      .close-button {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }

      .close-button:hover:not(:disabled) {
        color: white;
      }

      .close-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .modal-body {
        padding: 1.25rem;
      }

      .input-label {
        display: block;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 0.5rem;
      }

      .input-field {
        width: 100%;
        padding: 0.75rem 1rem;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: white;
        font-size: 1rem;
        font-family: inherit;
        transition: all 0.2s;
      }

      .input-field:focus {
        outline: none;
        border-color: var(--neon-purple);
        box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
      }

      .input-field:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .input-field.input-error {
        border-color: #ef4444;
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
      }

      .input-hint {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
        margin-top: 0.5rem;
      }

      .error-text {
        color: #ef4444;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .btn-secondary:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
        color: white;
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--neon-purple), var(--neon-cyan));
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
      }

      .saving-spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class ProfileEditModalComponent implements AfterViewInit {
  currentDisplayName = input.required<string>();
  isSaving = input<boolean>(false);

  dismiss = output<void>();
  save = output<string>();

  displayNameInput = viewChild<ElementRef<HTMLInputElement>>('displayNameInput');

  inputValue = signal('');
  touched = signal(false);

  hasError = computed(() => {
    if (!this.touched()) return false;
    const value = this.inputValue().trim();
    return value.length < 2 || value.length > 50;
  });

  errorMessage = computed(() => {
    const value = this.inputValue().trim();
    if (value.length === 0) return 'Nickname is required';
    if (value.length < 2) return 'Nickname must be at least 2 characters';
    if (value.length > 50) return 'Nickname must be at most 50 characters';
    return '';
  });

  canSave = computed(() => {
    const value = this.inputValue().trim();
    return (
      value.length >= 2 &&
      value.length <= 50 &&
      value !== this.currentDisplayName()
    );
  });

  ngAfterViewInit() {
    this.inputValue.set(this.currentDisplayName());
    // Focus the input after a brief delay to ensure the modal is rendered
    setTimeout(() => {
      this.displayNameInput()?.nativeElement.focus();
      this.displayNameInput()?.nativeElement.select();
    }, 50);
  }

  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.inputValue.set(input.value);
    this.touched.set(true);
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !this.isSaving()) {
      this.onCancel();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBackdropKeydown(_event: Event) {
    // This satisfies the accessibility lint rule requiring keyboard handlers
    // alongside click handlers. The actual keyboard handling (escape, enter)
    // is done by more specific event bindings.
  }

  onCancel() {
    if (!this.isSaving()) {
      this.dismiss.emit();
    }
  }

  onSave() {
    if (this.canSave() && !this.isSaving()) {
      this.save.emit(this.inputValue().trim());
    }
  }
}
