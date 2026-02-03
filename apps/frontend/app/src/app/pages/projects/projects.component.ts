import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActiveProject } from '../../core/models/active-project.model';
import { ActiveProjectsService } from '../../core/services/active-projects.service';
import { ProjectCardComponent } from '../../components/project-card.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [ProjectCardComponent],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="relative z-10">
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">Weet wat er speelt</h1>
        <p class="text-sm md:text-base text-slate-400 mt-1 font-mono">Active projects overview</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-4 md:px-6 lg:px-8 pb-24">
      @if (isLoading()) {
        <div class="flex items-center justify-center py-20">
          <div class="text-xl md:text-2xl text-purple-400/70 animate-pulse font-mono" role="status" aria-live="polite">
            Loading projects...
          </div>
        </div>
      } @else if (projects().length === 0) {
        <div class="flex flex-col items-center justify-center py-20">
          <div class="text-6xl mb-4" aria-hidden="true">🏗️</div>
          <p class="text-lg md:text-2xl text-slate-500 font-mono">No active projects</p>
          <p class="text-sm md:text-base mt-2 text-slate-600 font-mono">
            Start working on a repository to see it here
          </p>
        </div>
      } @else {
        <div class="max-w-6xl mx-auto py-6">
          <!-- Stats Summary -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ projects().length }}</div>
                <div class="stat-label">Active Projects</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ totalContributors() }}</div>
                <div class="stat-label">Contributors</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ totalActivities() }}</div>
                <div class="stat-label">Activities</div>
              </div>
            </div>
          </div>

          <!-- Projects Grid -->
          <div class="projects-grid">
            @for (project of projects(); track project.id) {
              <app-project-card [project]="project" />
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

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(191, 0, 255, 0.2);
        border-radius: 10px;
        padding: 1.25rem;
        transition: all 0.3s ease;
      }

      .stat-card:hover {
        border-color: rgba(191, 0, 255, 0.4);
        box-shadow: 0 4px 16px rgba(191, 0, 255, 0.15);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(191, 0, 255, 0.1);
        border-radius: 8px;
        color: var(--neon-purple, #bf00ff);
        flex-shrink: 0;
      }

      .stat-icon svg {
        width: 28px;
        height: 28px;
      }

      .stat-content {
        flex: 1;
      }

      .stat-value {
        font-size: 1.875rem;
        font-weight: 700;
        color: var(--neon-cyan, #00f5ff);
        font-family: 'JetBrains Mono', monospace;
        line-height: 1;
      }

      .stat-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-family: 'JetBrains Mono', monospace;
        margin-top: 0.375rem;
      }

      .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
      }

      @media (max-width: 640px) {
        .projects-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (min-width: 768px) {
        .stats-grid {
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          padding: 1.5rem;
        }

        .stat-value {
          font-size: 2.25rem;
        }

        .projects-grid {
          gap: 2rem;
        }
      }
    `,
  ],
})
export class ProjectsComponent implements OnInit, OnDestroy {
  readonly #activeProjectsService = inject(ActiveProjectsService);

  #projectsSubscription: Subscription | null = null;

  isLoading = signal(true);
  projects = signal<ActiveProject[]>([]);

  // Computed values for stats
  totalContributors = computed(() => {
    const uniqueContributors = new Set<string>();
    for (const project of this.projects()) {
      project.contributors.forEach((contributor) => uniqueContributors.add(contributor));
    }
    return uniqueContributors.size;
  });

  totalActivities = computed(() => {
    return this.projects().reduce((sum, project) => sum + project.activityCount, 0);
  });

  ngOnInit() {
    this.#loadProjects();
  }

  ngOnDestroy() {
    if (this.#projectsSubscription) {
      this.#projectsSubscription.unsubscribe();
    }
  }

  #loadProjects() {
    this.isLoading.set(true);

    // Load active projects from last 7 days
    this.#projectsSubscription = this.#activeProjectsService
      .getActiveProjects(7, 500)
      .subscribe({
        next: (projects) => {
          this.projects.set(projects);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.isLoading.set(false);
        },
      });
  }
}
