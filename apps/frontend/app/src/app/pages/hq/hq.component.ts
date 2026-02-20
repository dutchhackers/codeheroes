import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Subscription, switchMap } from 'rxjs';
import { UserSettingsService } from '../../core/services/user-settings.service';
import {
  HqDataService,
  DailyProgress,
  WeeklyStats,
  Highlight,
} from '../../core/services/hq-data.service';
import { DailyProgressComponent } from './components/daily-progress.component';
import { WeeklyStatsComponent } from './components/weekly-stats.component';
import { RankCardComponent } from './components/rank-card.component';
import { HighlightsComponent } from './components/highlights.component';

@Component({
  selector: 'app-hq',
  standalone: true,
  imports: [
    DailyProgressComponent,
    WeeklyStatsComponent,
    RankCardComponent,
    HighlightsComponent,
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

          <!-- Your Rank -->
          <app-rank-card
            [rank]="currentUserRank()"
            [xpGained]="weeklyStats()?.xpGained ?? 0"
            [isLoading]="leaderboardLoading()"
          />

          <!-- Recent Highlights -->
          <app-highlights [highlights]="highlights()" />
        </div>
      }
    </main>

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
  readonly #userSettingsService = inject(UserSettingsService);

  #dailyProgressSub: Subscription | null = null;
  #weeklyStatsSub: Subscription | null = null;
  #leaderboardSub: Subscription | null = null;
  #highlightsSub: Subscription | null = null;

  isLoading = signal(true);
  dailyProgress = signal<DailyProgress | null>(null);
  weeklyStats = signal<WeeklyStats | null>(null);
  leaderboardLoading = signal(true);
  currentUserRank = signal<number | null>(null);
  highlights = signal<Highlight[]>([]);

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
    // Load daily progress (using user's configured daily goal)
    this.#dailyProgressSub = this.#userSettingsService.getDailyGoal().pipe(
      switchMap((goal) => this.#hqDataService.getDailyProgress(goal)),
    ).subscribe({
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

    // Load leaderboard (for rank card)
    this.#leaderboardSub = this.#hqDataService.getWeeklyLeaderboard(0).subscribe({
      next: ({ currentUserRank }) => {
        this.currentUserRank.set(currentUserRank);
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
    // All 4 data sources have responded (daily, weekly, leaderboard rank, highlights)
    if (this.#loadCount >= 4) {
      this.isLoading.set(false);
    }
  }
}
