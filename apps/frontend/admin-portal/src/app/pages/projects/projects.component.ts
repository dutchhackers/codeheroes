import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectCardComponent } from './components/project-card.component';
import { ProjectsService } from '../../core/services/projects.service';
import { ProjectSummaryDto } from '@codeheroes/types';

@Component({
  selector: 'admin-projects',
  standalone: true,
  imports: [FormsModule, ProjectCardComponent],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Projects</h1>
          @if (!isLoading() && !error()) {
            <p class="page-subtitle">{{ filteredProjects().length }} projects</p>
          }
        </div>
        @if (!isLoading() && !error() && projects().length > 0) {
          <div class="search-container">
            <input
              class="search-input"
              type="text"
              placeholder="Search projects..."
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
            />
          </div>
        }
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <p>Loading projects...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button class="retry-button" (click)="loadProjects()">Try again</button>
        </div>
      } @else if (projects().length === 0) {
        <div class="empty-state">
          <p>No projects found.</p>
        </div>
      } @else if (filteredProjects().length === 0) {
        <div class="empty-state">
          @if (searchTerm()) {
            <p>No projects matching "{{ searchTerm() }}".</p>
          } @else {
            <p>No projects found.</p>
          }
        </div>
      } @else {
        <div class="projects-grid">
          @for (project of filteredProjects(); track project.id) {
            <admin-project-card [project]="project" (viewClick)="openProject(project)" />
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

      .search-container {
        flex-shrink: 0;
      }

      .search-input {
        padding: 8px 12px;
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 6px;
        font-size: 14px;
        color: var(--theme-color-text-default);
        background: var(--theme-color-bg-surface-default);
        min-width: 240px;
        font-family: inherit;
      }

      .search-input:focus {
        outline: none;
        border-color: var(--theme-color-border-brand-default);
      }

      .search-input::placeholder {
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

      .retry-button {
        padding: 6px 12px;
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 6px;
        background: var(--theme-color-bg-surface-default);
        color: var(--theme-color-text-default);
        font-size: 13px;
        cursor: pointer;
        font-family: inherit;
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
  readonly #router = inject(Router);

  readonly projects = signal<ProjectSummaryDto[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');

  readonly filteredProjects = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.projects();
    return this.projects().filter(
      (p) => p.name.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term),
    );
  });

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

  openProject(project: ProjectSummaryDto): void {
    this.#router.navigate(['/projects', project.id]);
  }
}
