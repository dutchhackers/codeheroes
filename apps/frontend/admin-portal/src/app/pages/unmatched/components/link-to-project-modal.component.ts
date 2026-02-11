import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { UnmatchedEvent, ProjectSummaryDto } from '@codeheroes/types';
import { ProjectsService } from '../../../core/services/projects.service';
import { UnmatchedEventsService } from '../../../core/services/unmatched-events.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'admin-link-to-project-modal',
  standalone: true,
  imports: [SuiButtonComponent],
  template: `
    <div class="modal-overlay" (click)="closed.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <h2 class="modal-title">Link to Project</h2>
        <p class="modal-subtitle">Link {{ event.repoFullName }} to an existing project</p>

        <div class="project-list">
          @if (isLoadingProjects()) {
            <div class="list-status">Loading projects...</div>
          } @else if (projects().length === 0) {
            <div class="list-status">No projects found</div>
          } @else {
            @for (project of projects(); track project.id) {
              <div
                class="project-option"
                [class.project-option--selected]="selectedProjectId() === project.id"
                (click)="selectProject(project.id)"
              >
                <div class="project-option-name">{{ project.name }}</div>
                @if (project.slug) {
                  <div class="project-option-slug">{{ project.slug }}</div>
                }
              </div>
            }
          }
        </div>

        @if (errorMsg()) {
          <div class="form-error">{{ errorMsg() }}</div>
        }

        <div class="modal-actions">
          <sui-button
            variant="outline"
            color="neutral"
            size="sm"
            (click)="closed.emit()"
            [disabled]="isSaving()"
          >
            Cancel
          </sui-button>
          <sui-button
            variant="solid"
            color="brand"
            size="sm"
            (click)="save()"
            [disabled]="isSaving() || !selectedProjectId()"
          >
            {{ isSaving() ? 'Linking...' : 'Link to Project' }}
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
      .project-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 6px;
        margin-bottom: 16px;
      }
      .list-status {
        padding: 16px;
        text-align: center;
        color: var(--theme-color-text-neutral-tertiary);
        font-size: 13px;
      }
      .project-option {
        padding: 10px 12px;
        cursor: pointer;
        border-bottom: 1px solid var(--theme-color-border-default-default);
        transition: background 0.1s;
      }
      .project-option:last-child {
        border-bottom: none;
      }
      .project-option:hover {
        background: var(--theme-color-bg-neutral-secondary);
      }
      .project-option--selected {
        background: var(--theme-color-bg-brand-secondary);
      }
      .project-option-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--theme-color-text-default);
      }
      .project-option-slug {
        font-size: 12px;
        color: var(--theme-color-text-neutral-tertiary);
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
export class LinkToProjectModalComponent implements OnInit {
  @Input() event!: UnmatchedEvent;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  readonly #projectsService = inject(ProjectsService);
  readonly #unmatchedEventsService = inject(UnmatchedEventsService);

  readonly projects = signal<ProjectSummaryDto[]>([]);
  readonly selectedProjectId = signal<string | null>(null);
  readonly isLoadingProjects = signal(true);
  readonly isSaving = signal(false);
  readonly errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.#projectsService.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.isLoadingProjects.set(false);
      },
      error: () => this.isLoadingProjects.set(false),
    });
  }

  selectProject(id: string): void {
    this.selectedProjectId.set(id);
  }

  save(): void {
    const projectId = this.selectedProjectId();
    if (!projectId) return;

    this.isSaving.set(true);
    this.errorMsg.set(null);

    this.#projectsService
      .getProject(projectId)
      .pipe(
        switchMap((project) => {
          const repositories = [...(project.repositories || [])];
          repositories.push({
            provider: this.event.provider,
            owner: this.event.repoOwner!,
            name: this.event.repoName!,
            fullName: this.event.repoFullName || `${this.event.repoOwner}/${this.event.repoName}`,
          });
          return this.#projectsService.updateProject(projectId, { repositories });
        }),
        switchMap(() =>
          this.#unmatchedEventsService.resolve(this.event.id, {
            resolutionAction: 'linked_to_project',
            resolutionTargetId: projectId,
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
          this.errorMsg.set(err?.error?.error || 'Failed to link project');
          console.error('Failed to link project:', err);
        },
      });
  }
}
