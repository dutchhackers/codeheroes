import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DisciplineOption, StudioOption, UserDimensions } from '@codeheroes/types';
import { Subscription } from 'rxjs';
import { SystemOptionsService } from '../../../core/services/system-options.service';

export interface ProfileEditPayload {
  displayName: string;
  dimensions: UserDimensions;
}

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
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
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
            [class.input-error]="hasNameError() || saveError()"
            [value]="inputValue()"
            (input)="onInputChange($event)"
            (keydown.enter)="onSave()"
            [disabled]="isSaving()"
            maxlength="50"
            autocomplete="off"
            aria-describedby="displayName-hint"
            [attr.aria-invalid]="hasNameError() || saveError() ? 'true' : 'false'"
          />
          <div
            id="displayName-hint"
            class="input-hint"
            [class.error-text]="hasNameError() || saveError()"
            aria-live="polite"
          >
            @if (saveError()) {
              {{ saveError() }}
            } @else if (hasNameError()) {
              {{ errorMessage() }}
            } @else {
              2-50 characters
            }
          </div>

          <div class="field-group">
            <label class="input-label" for="studio">Primary studio</label>
            <select
              id="studio"
              class="input-field"
              [value]="studioValue() ?? ''"
              (change)="onStudioChange($event)"
              [disabled]="isSaving() || optionsLoading()"
            >
              <option value="">—</option>
              @for (studio of studios(); track studio.id) {
                <option [value]="studio.id">{{ studio.label }}</option>
              }
            </select>
            <div class="input-hint">Choose your primary studio. You can change this later.</div>
          </div>

          <div class="field-group">
            <label class="input-label" for="discipline">Primary discipline</label>
            <select
              id="discipline"
              class="input-field"
              [value]="disciplineValue() ?? ''"
              (change)="onDisciplineChange($event)"
              [disabled]="isSaving() || optionsLoading()"
            >
              <option value="">—</option>
              @for (discipline of disciplines(); track discipline.id) {
                <option [value]="discipline.id">{{ discipline.label }}</option>
              }
            </select>
            <div class="input-hint">Pick what best describes your main craft.</div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="onCancel()" [disabled]="isSaving()">Cancel</button>
          <button type="button" class="btn btn-primary" (click)="onSave()" [disabled]="!canSave() || isSaving()">
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
        background: linear-gradient(135deg, rgba(20, 20, 30, 0.98), rgba(30, 20, 40, 0.98));
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

      .field-group {
        margin-top: 1rem;
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

      select.input-field {
        appearance: none;
        background-image: linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.5) 50%),
          linear-gradient(135deg, rgba(255, 255, 255, 0.5) 50%, transparent 50%);
        background-position:
          calc(100% - 18px) 1.05rem,
          calc(100% - 13px) 1.05rem;
        background-size:
          5px 5px,
          5px 5px;
        background-repeat: no-repeat;
        padding-right: 2.25rem;
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
export class ProfileEditModalComponent implements AfterViewInit, OnDestroy, OnInit {
  readonly #systemOptions = inject(SystemOptionsService);

  currentDisplayName = input.required<string>();
  currentDimensions = input<UserDimensions | null>(null);
  isSaving = input<boolean>(false);
  saveError = input<string | null>(null);

  dismiss = output<void>();
  save = output<ProfileEditPayload>();

  displayNameInput = viewChild<ElementRef<HTMLInputElement>>('displayNameInput');

  inputValue = signal('');
  studioValue = signal<string | null>(null);
  disciplineValue = signal<string | null>(null);
  touched = signal(false);

  studios = signal<StudioOption[]>([]);
  disciplines = signal<DisciplineOption[]>([]);
  optionsLoading = signal(true);

  #optionsSub: Subscription | null = null;

  hasNameError = computed(() => {
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
    if (value.length < 2 || value.length > 50) return false;

    const currentDims = this.currentDimensions();
    const currentStudio = currentDims?.studio ?? null;
    const currentDiscipline = currentDims?.discipline ?? null;

    const nameChanged = value !== this.currentDisplayName();
    const studioChanged = (this.studioValue() ?? null) !== currentStudio;
    const disciplineChanged = (this.disciplineValue() ?? null) !== currentDiscipline;

    return nameChanged || studioChanged || disciplineChanged;
  });

  ngOnInit() {
    this.#optionsSub = this.#systemOptions.getOptions().subscribe({
      next: (options) => {
        this.studios.set((options.studios ?? []).filter((s) => s.active));
        this.disciplines.set((options.disciplines ?? []).filter((d) => d.active));
        this.optionsLoading.set(false);
      },
      error: () => {
        this.optionsLoading.set(false);
      },
    });
  }

  ngAfterViewInit() {
    this.inputValue.set(this.currentDisplayName());
    const dims = this.currentDimensions();
    this.studioValue.set(dims?.studio ?? null);
    this.disciplineValue.set(dims?.discipline ?? null);
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

  onStudioChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.studioValue.set(select.value === '' ? null : select.value);
  }

  onDisciplineChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.disciplineValue.set(select.value === '' ? null : select.value);
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

  ngOnDestroy() {
    this.#optionsSub?.unsubscribe();
  }

  onCancel() {
    if (!this.isSaving()) {
      this.dismiss.emit();
    }
  }

  onSave() {
    if (this.canSave() && !this.isSaving()) {
      this.save.emit({
        displayName: this.inputValue().trim(),
        dimensions: {
          studio: this.studioValue(),
          discipline: this.disciplineValue(),
        },
      });
    }
  }
}
