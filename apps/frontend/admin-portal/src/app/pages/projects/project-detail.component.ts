import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { ProjectDetailDto, ProjectSummaryDto } from '@codeheroes/types';
import { ProjectsService } from '../../core/services/projects.service';
import { EditProjectModalComponent } from './components/edit-project-modal.component';

@Component({
  selector: 'admin-project-detail',
  standalone: true,
  imports: [SuiButtonComponent, EditProjectModalComponent],
  template: `
    <div>
      <button type="button" class="back-link" (click)="goBack()">&larr; Back to Projects</button>

      @if (isLoading()) {
        <div class="loading-state">
          <p>Loading project...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <sui-button variant="outline" color="neutral" size="sm" (click)="loadProject()">
            Try again
          </sui-button>
        </div>
      } @else if (project(); as p) {
        <div class="project-header">
          <div class="project-icon">{{ p.name.charAt(0).toUpperCase() }}</div>
          <div class="project-info">
            <h1 class="project-name">{{ p.name }}</h1>
            <p class="project-slug">{{ p.slug }}</p>
            @if (p.description) {
              <p class="project-description">{{ p.description }}</p>
            }
          </div>
          <sui-button variant="outline" color="neutral" size="sm" (click)="openEditModal()">
            Edit
          </sui-button>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Total XP</span>
            <span class="stat-value">{{ formatNumber(p.stats?.totalXp || 0) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Actions</span>
            <span class="stat-value">{{ formatNumber(p.stats?.totalActions || 0) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Members</span>
            <span class="stat-value">{{ p.stats?.activeMembers?.length || 0 }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Repositories</span>
            <span class="stat-value">{{ p.repositories.length || 0 }}</span>
          </div>
        </div>

        @if (p.repositories && p.repositories.length > 0) {
          <div class="section">
            <h2 class="section-title">Repositories</h2>
            <div class="table-container">
              <table class="repos-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Repository</th>
                  </tr>
                </thead>
                <tbody>
                  @for (repo of p.repositories; track repo.fullName) {
                    <tr>
                      <td><span class="provider-badge">{{ repo.provider }}</span></td>
                      <td class="monospace">{{ repo.fullName }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>

    @if (editingProject()) {
      <admin-edit-project-modal
        [project]="editingProject()!"
        (cancel)="closeEditModal()"
        (save)="saveProject($event)"
      />
    }
  `,
  styles: [
    `
      .back-link {
        display: inline-block;
        margin-bottom: 24px;
        padding: 0;
        border: none;
        background: none;
        font-size: 14px;
        color: var(--theme-color-text-brand-default);
        cursor: pointer;
        font-family: inherit;
      }

      .back-link:hover {
        text-decoration: underline;
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

      .project-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 32px;
      }

      .project-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        background: var(--theme-color-bg-brand-default);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 24px;
        flex-shrink: 0;
      }

      .project-info {
        flex: 1;
      }

      .project-name {
        font-size: 24px;
        font-weight: 700;
        color: var(--theme-color-text-default);
        margin-bottom: 2px;
      }

      .project-slug {
        font-size: 14px;
        color: var(--theme-color-text-neutral-tertiary);
        margin-bottom: 4px;
      }

      .project-description {
        font-size: 14px;
        color: var(--theme-color-text-neutral-secondary);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 32px;
      }

      .stat-card {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 8px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .stat-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--theme-color-text-neutral-tertiary);
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--theme-color-text-default);
      }

      .section {
        margin-bottom: 32px;
      }

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--theme-color-text-default);
        margin-bottom: 16px;
      }

      .table-container {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 8px;
        overflow: hidden;
      }

      .repos-table {
        width: 100%;
        border-collapse: collapse;
      }

      .repos-table th {
        text-align: left;
        padding: 12px 16px;
        font-size: 12px;
        font-weight: 600;
        color: var(--theme-color-text-neutral-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--theme-color-border-default-default);
        background: var(--theme-color-bg-neutral-secondary);
      }

      .repos-table td {
        padding: 12px 16px;
        font-size: 14px;
        color: var(--theme-color-text-default);
        border-bottom: 1px solid var(--theme-color-border-default-default);
      }

      .repos-table tr:last-child td {
        border-bottom: none;
      }

      .provider-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        background: var(--theme-color-bg-neutral-secondary);
        color: var(--theme-color-text-neutral-secondary);
        text-transform: capitalize;
      }

      .monospace {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
      }

      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class ProjectDetailComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #projectsService = inject(ProjectsService);

  readonly project = signal<ProjectDetailDto | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly editingProject = signal<ProjectSummaryDto | null>(null);

  #projectId = '';

  ngOnInit(): void {
    this.#projectId = this.#route.snapshot.params['id'];
    this.loadProject();
  }

  loadProject(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.#projectsService.getProject(this.#projectId).subscribe({
      next: (project) => {
        this.project.set(project);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load project.');
        this.isLoading.set(false);
      },
    });
  }

  openEditModal(): void {
    const p = this.project();
    if (!p) return;
    this.editingProject.set({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      repositoryCount: p.repositories.length || 0,
      totalXp: p.stats?.totalXp || 0,
      totalActions: p.stats?.totalActions || 0,
      activeMemberCount: p.stats?.activeMembers?.length || 0,
      activeRepoCount: p.stats?.activeRepos?.length || 0,
    });
  }

  closeEditModal(): void {
    this.editingProject.set(null);
  }

  saveProject(newName: string): void {
    const p = this.project();
    if (!p) return;
    this.#projectsService.updateProject(p.id, { name: newName }).subscribe({
      next: () => {
        this.loadProject();
        this.closeEditModal();
      },
      error: (err) => console.error('Failed to update project:', err),
    });
  }

  goBack(): void {
    this.#router.navigate(['/projects']);
  }

  formatNumber(value: number): string {
    return value.toLocaleString();
  }
}
