import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, take } from 'rxjs';
import {
  ProjectDetailDto,
  ProjectTimeBasedStats,
  Activity,
  isGameActionActivity,
} from '@codeheroes/types';
import { ProjectDataService } from '../../core/services/project-data.service';
import { UserCacheService, UserInfo } from '../../core/services/user-cache.service';
import { ActivityFeedService } from '../../core/services/activity-feed.service';
import { ProjectStatsCardComponent } from './components/project-stats-card.component';
import { ProjectMembersComponent } from './components/project-members.component';
import { ProjectActivityFeedComponent } from './components/project-activity-feed.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [ProjectStatsCardComponent, ProjectMembersComponent, ProjectActivityFeedComponent],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="flex items-center gap-3 relative z-10">
        <button
          type="button"
          (click)="goBack()"
          aria-label="Go back to projects"
          class="back-button"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-xl md:text-3xl font-bold italic text-white truncate">
          {{ project()?.name ?? 'Project' }}
        </h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-4 md:px-6 lg:px-8 pb-24">
      @if (isLoading()) {
        <div class="flex items-center justify-center py-20">
          <div class="text-xl md:text-2xl text-purple-400/70 animate-pulse" role="status" aria-live="polite">
            Loading...
          </div>
        </div>
      } @else if (!project()) {
        <div class="flex flex-col items-center justify-center py-20">
          <p class="text-lg md:text-2xl text-slate-500 text-center">Project not found</p>
        </div>
      } @else {
        <div class="max-w-2xl mx-auto py-4 md:py-6">
          @if (project()?.description) {
            <p class="text-sm text-slate-400 mb-6">{{ project()?.description }}</p>
          }

          <!-- Summary Stats -->
          <div class="stats-grid">
            <app-project-stats-card
              [value]="formatXp(project()?.stats?.totalXp ?? 0)"
              label="Total XP"
              colorClass="text-cyan-400"
            />
            <app-project-stats-card
              [value]="(project()?.stats?.activeMembers?.length ?? 0).toString()"
              label="Members"
              colorClass="text-purple-400"
            />
            <app-project-stats-card
              [value]="(project()?.stats?.activeRepos?.length ?? 0).toString()"
              label="Repos"
              colorClass="text-orange-400"
            />
            <app-project-stats-card
              [value]="(project()?.stats?.totalActions ?? 0).toString()"
              label="Actions"
              colorClass="text-green-400"
            />
          </div>

          <!-- This Week -->
          @if (weeklyStats()) {
            <div class="week-section">
              <h3 class="section-title">This Week</h3>
              <div class="week-card">
                <div class="week-stat">
                  <span class="week-value text-cyan-400">{{ formatXp(weeklyStats()!.xpGained) }}</span>
                  <span class="week-label">XP Gained</span>
                </div>
                @for (entry of weeklyActionBreakdown(); track entry.label) {
                  <div class="week-stat">
                    <span class="week-value">{{ entry.count }}</span>
                    <span class="week-label">{{ entry.label }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Team Members -->
          <app-project-members
            [members]="memberInfos()"
            (selectMember)="openUserProfile($event)"
          />

          <!-- Recent Activity -->
          <app-project-activity-feed [activities]="projectActivities()" />
        </div>
      }
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .back-button {
        padding: 0.625rem;
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .back-button:hover {
        color: white;
        border-color: rgba(255, 255, 255, 0.4);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      @media (min-width: 480px) {
        .stats-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      .week-section {
        margin-top: 1.5rem;
      }

      .section-title {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--neon-cyan, #00f5ff);
        margin: 0 0 1rem 0;
      }

      .week-card {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 1rem;
      }

      @media (min-width: 480px) {
        .week-card {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .week-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.125rem;
      }

      .week-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.9);
        line-height: 1;
      }

      .week-label {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.45);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        text-align: center;
      }
    `,
  ],
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #projectDataService = inject(ProjectDataService);
  readonly #userCacheService = inject(UserCacheService);
  readonly #activityFeedService = inject(ActivityFeedService);

  #routeSub: Subscription | null = null;
  #dataSub: Subscription | null = null;
  #activitySub: Subscription | null = null;

  project = signal<ProjectDetailDto | null>(null);
  weeklyStats = signal<ProjectTimeBasedStats | null>(null);
  memberInfos = signal<UserInfo[]>([]);
  projectActivities = signal<Activity[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.#routeSub = this.#route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.#loadProject(id);
      }
    });
  }

  ngOnDestroy() {
    this.#routeSub?.unsubscribe();
    this.#dataSub?.unsubscribe();
    this.#activitySub?.unsubscribe();
  }

  async #loadProject(id: string) {
    this.isLoading.set(true);
    this.#dataSub?.unsubscribe();
    this.#activitySub?.unsubscribe();
    await this.#userCacheService.loadUsers();

    this.#dataSub = combineLatest({
      detail: this.#projectDataService.getProjectDetail(id),
      weekly: this.#projectDataService.getProjectWeeklyStats(id),
    }).pipe(take(1)).subscribe({
      next: ({ detail, weekly }) => {
        this.project.set(detail);
        this.weeklyStats.set(weekly);

        // Resolve member user infos
        const memberIds = detail.stats?.activeMembers ?? [];
        const infos = memberIds
          .map((uid) => this.#userCacheService.getUserInfo(uid))
          .filter((info): info is UserInfo => info !== null);
        this.memberInfos.set(infos);

        // Load activities filtered to project repos
        this.#loadProjectActivities(detail);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load project:', error);
        this.isLoading.set(false);
      },
    });
  }

  #loadProjectActivities(project: ProjectDetailDto) {
    const repoFullNames = new Set(project.repositories.map((r) => r.fullName));
    if (repoFullNames.size === 0) return;

    this.#activitySub = this.#activityFeedService.getGlobalActivities(100).subscribe({
      next: (activities) => {
        const filtered = activities.filter((activity) => {
          if (!isGameActionActivity(activity)) return false;
          const context = activity.context;
          if ('repository' in context && context.repository) {
            const fullName = `${context.repository.owner}/${context.repository.name}`;
            return repoFullNames.has(fullName);
          }
          return false;
        });
        this.projectActivities.set(filtered.slice(0, 20));
      },
      error: (error) => {
        console.error('Failed to load project activities:', error);
      },
    });
  }

  weeklyActionBreakdown(): { label: string; count: number }[] {
    const stats = this.weeklyStats();
    if (!stats) return [];

    const actions = stats.counters?.actions ?? {};
    const entries: { label: string; count: number }[] = [];

    if (actions['code_push']) entries.push({ label: 'Pushes', count: actions['code_push'] });
    if (actions['pull_request_create']) entries.push({ label: 'PRs Created', count: actions['pull_request_create'] });
    if (actions['pull_request_merge']) entries.push({ label: 'PRs Merged', count: actions['pull_request_merge'] });
    if (actions['code_review_submit']) entries.push({ label: 'Reviews', count: actions['code_review_submit'] });
    if (actions['issue_create']) entries.push({ label: 'Issues', count: actions['issue_create'] });

    // If no specific actions, show total
    if (entries.length === 0) {
      const total = Object.values(actions).reduce((sum, v) => sum + (v ?? 0), 0);
      if (total > 0) entries.push({ label: 'Total Actions', count: total });
    }

    return entries;
  }

  formatXp(value: number): string {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(value >= 10000 ? 0 : 1) + 'K';
    return value.toLocaleString();
  }

  openUserProfile(userId: string) {
    this.#router.navigate(['/users', userId]);
  }

  goBack() {
    this.#router.navigate(['/projects']);
  }
}
