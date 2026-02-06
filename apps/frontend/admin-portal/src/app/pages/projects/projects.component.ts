import { Component, OnInit, inject, signal } from '@angular/core';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { ProjectCardComponent } from './components/project-card.component';
import { ProjectsService } from '../../core/services/projects.service';
import { ProjectSummaryDto } from '@codeheroes/types';

@Component({
  selector: 'admin-projects',
  standalone: true,
  imports: [ProjectCardComponent, SuiButtonComponent],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Projects</h1>
          @if (!isLoading() && !error()) {
            <p class="page-subtitle">{{ projects().length }} projects</p>
          }
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <p>Loading projects...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <sui-button variant="outline" color="neutral" size="sm" (click)="loadProjects()">
            Try again
          </sui-button>
        </div>
      } @else if (projects().length === 0) {
        <div class="empty-state">
          <p>No projects found.</p>
        </div>
      } @else {
        <div class="projects-grid">
          @for (project of projects(); track project.id) {
            <admin-project-card [project]="project" />
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 24px;
      }

      .page-title {
        font-size: 24px;
        font-weight: 700;
        color: var(--theme-color-text-default);
        margin-bottom: 4px;
      }

      .page-subtitle {
        font-size: 14px;
        color: var(--theme-color-text-neutral-tertiary);
      }

      .loading-state,
      .empty-state {
        text-align: center;
        padding: 48px 0;
        color: var(--theme-color-text-neutral-tertiary);
        font-size: 14px;
      }

      .error-state {
        background: var(--theme-color-feedback-bg-error-secondary);
        border: 1px solid var(--theme-color-feedback-border-error-default);
        border-radius: 8px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--theme-color-feedback-text-error-default);
        font-size: 14px;
      }

      .projects-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      @media (max-width: 960px) {
        .projects-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 600px) {
        .projects-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ProjectsComponent implements OnInit {
  readonly #projectsService = inject(ProjectsService);

  readonly projects = signal<ProjectSummaryDto[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.#projectsService.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load projects. Please try again.');
        this.isLoading.set(false);
        console.error('Failed to load projects:', err);
      },
    });
  }
}
