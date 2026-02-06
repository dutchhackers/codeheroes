import { Component, OnInit, inject, signal } from '@angular/core';
import { ProjectCardComponent } from './components/project-card.component';
import { ProjectsService } from '../../core/services/projects.service';
import { ProjectSummaryDto } from '@codeheroes/types';

@Component({
  selector: 'admin-projects',
  standalone: true,
  imports: [ProjectCardComponent],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-slate-900">Projects</h2>
        @if (!isLoading() && !error()) {
          <span class="text-sm text-slate-500">{{ projects().length }} projects</span>
        }
      </div>

      @if (isLoading()) {
        <div class="flex items-center justify-center py-12">
          <p class="text-sm text-slate-500">Loading projects...</p>
        </div>
      } @else if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-700">{{ error() }}</p>
          <button
            type="button"
            (click)="loadProjects()"
            class="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try again
          </button>
        </div>
      } @else if (projects().length === 0) {
        <div class="text-center py-12">
          <p class="text-sm text-slate-500">No projects found.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (project of projects(); track project.id) {
            <admin-project-card [project]="project" />
          }
        </div>
      }
    </div>
  `,
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
