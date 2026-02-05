import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  HqDataService,
  DailyProgress,
  WeeklyStats,
  LeaderboardEntry,
  Highlight,
} from '../../core/services/hq-data.service';
import { DailyProgressComponent } from './components/daily-progress.component';
import { WeeklyStatsComponent } from './components/weekly-stats.component';
import { LeaderboardPreviewComponent } from './components/leaderboard-preview.component';
import { LeaderboardModalComponent } from './components/leaderboard-modal.component';
import { HighlightsComponent } from './components/highlights.component';
import { ActiveUsersFeedComponent } from './components/active-users-feed.component';

@Component({
  selector: 'app-hq',
  standalone: true,
  imports: [
    DailyProgressComponent,
    WeeklyStatsComponent,
    LeaderboardPreviewComponent,
    LeaderboardModalComponent,
    HighlightsComponent,
    ActiveUsersFeedComponent,
  ],
  template: `
    <!-- Header (desktop only - bottom nav identifies the tab on mobile) -->
    <header class="hidden md:block sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-6 lg:px-8 py-5">
      <div class="relative z-10">
        <h1 class="text-4xl font-bold italic text-white">HQ</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-4 pt-4 md:px-6 md:pt-0 lg:px-8 pb-24">
      @if (isLoading()) {
        <div class="flex items-center justify-center py-20">
          <div class="text-xl md:text-2xl text-purple-400/70 animate-pulse" role="status" aria-live="polite">
            Loading...
          </div>
        </div>
      } @else {
        <div class="max-w-2xl mx-auto py-2 md:py-6">
          <!-- Daily Progress -->
          <app-daily-progress [progress]="dailyProgress()" />

          <!-- Weekly Stats -->
          <app-weekly-stats [stats]="weeklyStats()" />

          <!-- Active Users Feed -->
          <app-active-users-feed />

          <!-- Leaderboard Preview -->
          <app-leaderboard-preview
            [entries]="leaderboardEntries()"
            [currentUserRank]="currentUserRank()"
            [currentUserId]="currentUserId()"
            [isLoading]="leaderboardLoading()"
            (viewAll)="showLeaderboardModal.set(true)"
          />

          <!-- Recent Highlights -->
          <app-highlights [highlights]="highlights()" />
        </div>
      }
    </main>

    <!-- Leaderboard Modal -->
    @if (showLeaderboardModal()) {
      <app-leaderboard-modal (dismiss)="showLeaderboardModal.set(false)" />
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class HqComponent implements OnInit, OnDestroy {
  readonly #hqDataService = inject(HqDataService);

  #dailyProgressSub: Subscription | null = null;
  #weeklyStatsSub: Subscription | null = null;
  #leaderboardSub: Subscription | null = null;
  #highlightsSub: Subscription | null = null;

  isLoading = signal(true);
  dailyProgress = signal<DailyProgress | null>(null);
  weeklyStats = signal<WeeklyStats | null>(null);
  leaderboardEntries = signal<LeaderboardEntry[]>([]);
  leaderboardLoading = signal(true);
  currentUserRank = signal<number | null>(null);
  currentUserId = signal<string | null>(null);
  highlights = signal<Highlight[]>([]);
  showLeaderboardModal = signal(false);

  ngOnInit() {
    this.#loadData();
  }

  ngOnDestroy() {
    this.#dailyProgressSub?.unsubscribe();
    this.#weeklyStatsSub?.unsubscribe();
    this.#leaderboardSub?.unsubscribe();
    this.#highlightsSub?.unsubscribe();
  }

  #loadData() {
    // Load daily progress
    this.#dailyProgressSub = this.#hqDataService.getDailyProgress().subscribe({
      next: (progress) => {
        this.dailyProgress.set(progress);
        this.#checkLoadingComplete();
      },
      error: (error) => {
        console.error('Failed to load daily progress:', error);
        this.#checkLoadingComplete();
      },
    });

    // Load weekly stats
    this.#weeklyStatsSub = this.#hqDataService.getWeeklyStats().subscribe({
      next: (stats) => {
        this.weeklyStats.set(stats);
        this.#checkLoadingComplete();
      },
      error: (error) => {
        console.error('Failed to load weekly stats:', error);
        this.#checkLoadingComplete();
      },
    });

    // Load leaderboard
    this.#leaderboardSub = this.#hqDataService.getWeeklyLeaderboard(5).subscribe({
      next: ({ entries, currentUserRank, currentUserId }) => {
        this.leaderboardEntries.set(entries);
        this.currentUserRank.set(currentUserRank);
        this.currentUserId.set(currentUserId);
        this.leaderboardLoading.set(false);
        this.#checkLoadingComplete();
      },
      error: (error) => {
        console.error('Failed to load leaderboard:', error);
        this.leaderboardLoading.set(false);
        this.#checkLoadingComplete();
      },
    });

    // Load highlights
    this.#highlightsSub = this.#hqDataService.getRecentHighlights(5).subscribe({
      next: (highlights) => {
        this.highlights.set(highlights);
        this.#checkLoadingComplete();
      },
      error: (error) => {
        console.error('Failed to load highlights:', error);
        this.#checkLoadingComplete();
      },
    });
  }

  #loadCount = 0;

  #checkLoadingComplete() {
    this.#loadCount++;
    // All 4 data sources have responded
    if (this.#loadCount >= 4) {
      this.isLoading.set(false);
    }
  }
}
