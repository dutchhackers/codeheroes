import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProjectSummaryDto } from '@codeheroes/types';
import { ProjectDataService } from '../../core/services/project-data.service';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [],
  template: `
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="relative z-10">
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">Projects</h1>
      </div>
    </header>

    <main class="relative z-10 px-4 md:px-6 lg:px-8 pb-24">
      @if (isLoading()) {
        <div class="flex items-center justify-center py-20">
          <div class="text-xl md:text-2xl text-purple-400/70 animate-pulse" role="status" aria-live="polite">
            Loading...
          </div>
        </div>
      } @else if (projects().length === 0) {
        <div class="flex flex-col items-center justify-center py-20">
          <div class="text-4xl mb-4">📂</div>
          <p class="text-lg md:text-2xl text-slate-500 text-center">No projects yet</p>
          <p class="text-sm md:text-base mt-3 text-slate-600 text-center">
            Projects will appear here once they're set up.
          </p>
        </div>
      } @else {
        <div class="max-w-2xl mx-auto py-4 md:py-6">
          <div class="flex flex-col gap-4">
            @for (project of projects(); track project.id) {
              <button
                type="button"
                class="project-card"
                (click)="openProject(project.id)"
                [attr.aria-label]="'View project ' + project.name"
              >
                <div class="card-header">
                  <h3 class="project-name">{{ project.name }}</h3>
                  @if (project.lastActivity; as la) {
                    <span class="last-activity">{{ formatTimeAgo(la.timestamp) }}</span>
                  }
                </div>
                @if (project.description) {
                  <p class="project-description">{{ project.description }}</p>
                }
                <div class="stats-row">
                  <div class="stat">
                    <span class="stat-value text-cyan-400">{{ formatXp(project.totalXp) }}</span>
                    <span class="stat-label">XP</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value text-purple-400">{{ project.activeMemberCount }}</span>
                    <span class="stat-label">Members</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value text-orange-400">{{ project.repositoryCount }}</span>
                    <span class="stat-label">Repos</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value text-green-400">{{ project.totalActions }}</span>
                    <span class="stat-label">Actions</span>
                  </div>
                </div>
              </button>
            }
          </div>
        </div>
      }
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .project-card {
        display: block;
        width: 100%;
        text-align: left;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.25rem 1.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        color: white;
      }

      .project-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
        box-shadow: 0 4px 20px rgba(191, 0, 255, 0.15);
      }

      .project-card:focus {
        outline: 2px solid rgba(255, 255, 255, 0.3);
        outline-offset: 2px;
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }

      .project-name {
        font-size: 1.125rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.95);
        margin: 0;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .last-activity {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
        white-space: nowrap;
        flex-shrink: 0;
      }

      .project-description {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.5);
        margin: 0 0 1rem 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.125rem;
      }

      .stat-value {
        font-size: 1.125rem;
        font-weight: 700;
        line-height: 1;
      }

      .stat-label {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      @media (min-width: 768px) {
        .project-name {
          font-size: 1.25rem;
        }

        .stat-value {
          font-size: 1.25rem;
        }

        .stat-label {
          font-size: 0.75rem;
        }
      }
    `,
  ],
})
export class ProjectsListComponent implements OnInit, OnDestroy {
  readonly #projectDataService = inject(ProjectDataService);
  readonly #router = inject(Router);

  #subscription: Subscription | null = null;

  projects = signal<ProjectSummaryDto[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.#subscription = this.#projectDataService.getProjects().subscribe({
      next: (projects) => {
        // Sort by totalXp descending
        const sorted = [...projects].sort((a, b) => a.name.localeCompare(b.name));
        this.projects.set(sorted);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load projects:', error);
        this.isLoading.set(false);
      },
    });
  }

  ngOnDestroy() {
    this.#subscription?.unsubscribe();
  }

  openProject(id: string) {
    this.#router.navigate(['/projects', id]);
  }

  formatXp(value: number): string {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(value >= 10000 ? 0 : 1) + 'K';
    return value.toLocaleString();
  }

  formatTimeAgo(timestamp: string): string {
    const then = new Date(timestamp).getTime();
    if (isNaN(then)) return 'Unknown';
    const now = Date.now();
    const diffMs = now - then;

    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;

    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
