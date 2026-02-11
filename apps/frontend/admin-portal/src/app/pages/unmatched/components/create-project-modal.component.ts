import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { UnmatchedEvent } from '@codeheroes/types';
import { ProjectsService } from '../../../core/services/projects.service';
import { UnmatchedEventsService } from '../../../core/services/unmatched-events.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'admin-create-project-modal',
  standalone: true,
  imports: [FormsModule, SuiButtonComponent],
  template: `
    <div class="modal-overlay" (click)="closed.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <h2 class="modal-title">Create Project</h2>
        <p class="modal-subtitle">Create a new project with {{ event.repoFullName }}</p>

        <div class="form-group">
          <label class="form-label">Project Name *</label>
          <input class="form-input" type="text" [(ngModel)]="projectName" (ngModelChange)="onNameChange($event)" placeholder="Project name" />
        </div>
        <div class="form-group">
          <label class="form-label">Slug *</label>
          <input class="form-input" type="text" [(ngModel)]="slug" placeholder="project-slug" />
          <span class="form-hint">Lowercase alphanumeric with hyphens</span>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea
            class="form-input form-textarea"
            [(ngModel)]="description"
            placeholder="Project description (optional)"
          ></textarea>
        </div>

        <div class="repo-info">
          Repository: <strong>{{ event.repoFullName }}</strong> ({{ event.provider }})
        </div>

        @if (errorMsg()) {
          <div class="form-error">{{ errorMsg() }}</div>
        }

        <div class="modal-actions">
          <sui-button variant="outline" color="neutral" size="sm" (click)="closed.emit()" [disabled]="isSaving()">
            Cancel
          </sui-button>
          <sui-button
            variant="solid"
            color="brand"
            size="sm"
            (click)="save()"
            [disabled]="isSaving() || !projectName || !slug"
          >
            {{ isSaving() ? 'Creating...' : 'Create Project' }}
          </sui-button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal-card {
        background: var(--theme-color-bg-surface-default);
        border-radius: 12px;
        padding: 24px;
        width: 480px;
        max-width: 90vw;
        box-shadow: var(--theme-effect-styles-drop-shadow-200);
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
      .form-group {
        margin-bottom: 16px;
      }
      .form-label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: var(--theme-color-text-default);
        margin-bottom: 6px;
      }
      .form-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 6px;
        font-size: 14px;
        color: var(--theme-color-text-default);
        background: var(--theme-color-bg-surface-default);
        font-family: inherit;
        box-sizing: border-box;
      }
      .form-input:focus {
        outline: none;
        border-color: var(--theme-color-border-brand-default);
      }
      .form-hint {
        display: block;
        font-size: 12px;
        color: var(--theme-color-text-neutral-tertiary);
        margin-top: 4px;
      }
      .form-textarea {
        min-height: 80px;
        resize: vertical;
      }
      .repo-info {
        padding: 10px 12px;
        background: var(--theme-color-bg-neutral-secondary);
        border-radius: 6px;
        font-size: 13px;
        color: var(--theme-color-text-neutral-secondary);
        margin-bottom: 16px;
      }
      .form-error {
        background: var(--theme-color-feedback-bg-error-secondary);
        border: 1px solid var(--theme-color-feedback-border-error-default);
        color: var(--theme-color-feedback-text-error-default);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 13px;
        margin-bottom: 16px;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
      }
    `,
  ],
})
export class CreateProjectModalComponent implements OnInit {
  @Input() event!: UnmatchedEvent;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  readonly #projectsService = inject(ProjectsService);
  readonly #unmatchedEventsService = inject(UnmatchedEventsService);

  projectName = '';
  slug = '';
  description = '';
  slugManuallyEdited = false;

  readonly isSaving = signal(false);
  readonly errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.projectName = this.event.repoName || '';
    this.slug = this.#toSlug(this.projectName);
  }

  onNameChange(name: string): void {
    if (!this.slugManuallyEdited) {
      this.slug = this.#toSlug(name);
    }
  }

  #toSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  save(): void {
    if (!this.projectName || !this.slug) return;

    this.isSaving.set(true);
    this.errorMsg.set(null);

    const projectData = {
      name: this.projectName,
      slug: this.slug,
      description: this.description || undefined,
      repositories: [
        {
          provider: this.event.provider,
          owner: this.event.repoOwner!,
          name: this.event.repoName!,
          fullName: this.event.repoFullName || `${this.event.repoOwner}/${this.event.repoName}`,
        },
      ],
    };

    this.#projectsService
      .createProject(projectData)
      .pipe(
        switchMap((project) =>
          this.#unmatchedEventsService.resolve(this.event.id, {
            resolutionAction: 'created_project',
            resolutionTargetId: project.id,
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMsg.set(err?.error?.error || 'Failed to create project');
          console.error('Failed to create project:', err);
        },
      });
  }
}
