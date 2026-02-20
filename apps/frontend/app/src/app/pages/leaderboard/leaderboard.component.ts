import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  LeaderboardService,
  LeaderboardEntry,
  ProjectLeaderboardEntry,
} from '../../core/services/leaderboard.service';
import { LeaderboardSectionComponent } from './leaderboard-section.component';

type LeaderboardPeriod = 'week' | 'day';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [LeaderboardSectionComponent],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="relative z-10">
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">Leaderboard</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-4 md:px-6 lg:px-8 pb-24">
      <div class="max-w-2xl mx-auto py-4 md:py-6">
        <!-- Period Toggle -->
        <div class="period-toggle">
          <button
            type="button"
            class="toggle-pill"
            [class.toggle-pill-active]="activePeriod() === 'week'"
            (click)="switchPeriod('week')"
          >
            This Week
          </button>
          <button
            type="button"
            class="toggle-pill"
            [class.toggle-pill-active]="activePeriod() === 'day'"
            (click)="switchPeriod('day')"
          >
            Today
          </button>
        </div>

        <!-- Heroes Section -->
        <div class="section-gap">
          <app-leaderboard-section
            title="Heroes"
            icon="⚔️"
            [viewAllRoute]="'/leaderboard/heroes'"
            [isLoading]="heroesLoading()"
            [userEntries]="heroEntries()"
            [currentUserId]="currentUserId()"
            [emptyMessage]="activePeriod() === 'day' ? 'No hero activity today yet' : 'No hero activity this week yet'"
          />
        </div>

        <!-- Bots Section -->
        <div class="section-gap">
          <app-leaderboard-section
            title="Bots"
            icon="🤖"
            [viewAllRoute]="'/leaderboard/bots'"
            [isLoading]="botsLoading()"
            [userEntries]="botEntries()"
            [currentUserId]="currentUserId()"
            [emptyMessage]="activePeriod() === 'day' ? 'No bot activity today yet' : 'No bot activity this week yet'"
          />
        </div>

        <!-- Projects Section -->
        <div class="section-gap">
          <app-leaderboard-section
            title="Projects"
            icon="📂"
            [viewAllRoute]="'/leaderboard/projects'"
            [isLoading]="projectsLoading()"
            [projectEntries]="projectEntries()"
            [emptyMessage]="activePeriod() === 'day' ? 'No project activity today yet' : 'No project activity this week yet'"
          />
        </div>
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .period-toggle {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .toggle-pill {
        padding: 0.5rem 1.25rem;
        border-radius: 9999px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: rgba(0, 0, 0, 0.3);
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .toggle-pill:hover {
        border-color: rgba(6, 182, 212, 0.5);
        color: white;
      }

      .toggle-pill-active {
        border-color: var(--neon-cyan);
        background: rgba(6, 182, 212, 0.15);
        color: var(--neon-cyan);
        box-shadow: 0 0 12px rgba(6, 182, 212, 0.2);
      }

      .section-gap {
        margin-bottom: 1.25rem;
      }
    `,
  ],
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  readonly #leaderboardService = inject(LeaderboardService);

  activePeriod = signal<LeaderboardPeriod>('week');
  heroesLoading = signal(true);
  botsLoading = signal(true);
  projectsLoading = signal(true);

  heroEntries = signal<LeaderboardEntry[]>([]);
  botEntries = signal<LeaderboardEntry[]>([]);
  projectEntries = signal<ProjectLeaderboardEntry[]>([]);
  currentUserId = signal<string | null>(null);

  #heroesSub: Subscription | null = null;
  #botsSub: Subscription | null = null;
  #projectsSub: Subscription | null = null;

  ngOnInit() {
    this.#loadAll();
  }

  ngOnDestroy() {
    this.#heroesSub?.unsubscribe();
    this.#botsSub?.unsubscribe();
    this.#projectsSub?.unsubscribe();
  }

  switchPeriod(period: LeaderboardPeriod) {
    if (period !== this.activePeriod()) {
      this.activePeriod.set(period);
      this.#loadAll();
    }
  }

  #loadAll() {
    const period = this.activePeriod();

    // Load heroes (top 5 users)
    this.heroesLoading.set(true);
    this.#heroesSub?.unsubscribe();
    this.#heroesSub = this.#leaderboardService.getUserLeaderboard(period, 'user', 5).subscribe({
      next: ({ entries, currentUserId }) => {
        this.heroEntries.set(entries);
        this.currentUserId.set(currentUserId);
        this.heroesLoading.set(false);
      },
      error: () => this.heroesLoading.set(false),
    });

    // Load bots (top 3)
    this.botsLoading.set(true);
    this.#botsSub?.unsubscribe();
    this.#botsSub = this.#leaderboardService.getUserLeaderboard(period, 'bot', 3).subscribe({
      next: ({ entries }) => {
        this.botEntries.set(entries);
        this.botsLoading.set(false);
      },
      error: () => this.botsLoading.set(false),
    });

    // Load projects (top 5)
    this.projectsLoading.set(true);
    this.#projectsSub?.unsubscribe();
    this.#projectsSub = this.#leaderboardService.getProjectLeaderboard(period, 5).subscribe({
      next: (entries) => {
        this.projectEntries.set(entries);
        this.projectsLoading.set(false);
      },
      error: () => this.projectsLoading.set(false),
    });
  }
}
