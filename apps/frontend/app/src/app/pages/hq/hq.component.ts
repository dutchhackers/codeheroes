import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  HqDataService,
  DailyProgress,
  WeeklyStats,
  LeaderboardEntry,
  Highlight,
} from '../../core/services/hq-data.service';
import { UserBadge } from '../../core/models/user-badge.model';
import { PeriodToggleComponent, Period } from './components/period-toggle.component';
import { PeriodProgressComponent } from './components/period-progress.component';
import { PeriodStatsComponent } from './components/period-stats.component';
import { LeaderboardPreviewComponent } from './components/leaderboard-preview.component';
import { LeaderboardModalComponent } from './components/leaderboard-modal.component';
import { HighlightsComponent } from './components/highlights.component';
import { AchievementsSectionComponent } from './components/achievements-section.component';

@Component({
  selector: 'app-hq',
  standalone: true,
  imports: [
    PeriodToggleComponent,
    PeriodProgressComponent,
    PeriodStatsComponent,
    LeaderboardPreviewComponent,
    LeaderboardModalComponent,
    HighlightsComponent,
    AchievementsSectionComponent,
  ],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="relative z-10 flex items-center justify-between">
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">HQ</h1>
        <app-period-toggle [selectedPeriod]="selectedPeriod()" (periodChange)="onPeriodChange($event)" />
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-4 md:px-6 lg:px-8 pb-24">
      @if (isLoading()) {
        <div class="flex items-center justify-center py-20">
          <div class="text-xl md:text-2xl text-purple-400/70 animate-pulse font-mono" role="status" aria-live="polite">
            Loading...
          </div>
        </div>
      } @else {
        <div class="max-w-2xl mx-auto py-6 space-y-6">
          <!-- Period Progress (Day/Week) -->
          <app-period-progress
            [period]="selectedPeriod()"
            [dailyProgress]="dailyProgress()"
            [weeklyStats]="weeklyStats()"
          />

          <!-- Activity Stats -->
          <app-period-stats
            [period]="selectedPeriod()"
            [weeklyStats]="selectedPeriod() === 'day' ? dailyStats() : weeklyStats()"
          />

          <!-- Achievements Section -->
          @if (badges().length > 0) {
            <app-achievements-section [badges]="badges()" [maxDisplay]="3" />
          }

          <!-- Leaderboard Preview -->
          <app-leaderboard-preview
            [period]="selectedPeriod()"
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

      .space-y-6 > * + * {
        margin-top: 1.5rem;
      }
    `,
  ],
})
export class HqComponent implements OnInit, OnDestroy {
  readonly #hqDataService = inject(HqDataService);

  // Number of data sources we're waiting for before showing content
  readonly #EXPECTED_DATA_SOURCES = 7;

  #dailyProgressSub: Subscription | null = null;
  #dailyStatsSub: Subscription | null = null;
  #weeklyStatsSub: Subscription | null = null;
  #dailyLeaderboardSub: Subscription | null = null;
  #weeklyLeaderboardSub: Subscription | null = null;
  #highlightsSub: Subscription | null = null;
  #badgesSub: Subscription | null = null;

  isLoading = signal(true);
  selectedPeriod = signal<Period>('week');
  
  dailyProgress = signal<DailyProgress | null>(null);
  dailyStats = signal<WeeklyStats | null>(null);
  weeklyStats = signal<WeeklyStats | null>(null);
  
  dailyLeaderboard = signal<LeaderboardEntry[]>([]);
  weeklyLeaderboard = signal<LeaderboardEntry[]>([]);
  dailyUserRank = signal<number | null>(null);
  weeklyUserRank = signal<number | null>(null);
  
  leaderboardLoading = signal(true);
  currentUserId = signal<string | null>(null);
  highlights = signal<Highlight[]>([]);
  badges = signal<UserBadge[]>([]);
  showLeaderboardModal = signal(false);

  // Computed values for the current period
  leaderboardEntries = signal<LeaderboardEntry[]>([]);
  currentUserRank = signal<number | null>(null);

  ngOnInit() {
    this.#loadData();
  }

  ngOnDestroy() {
    this.#dailyProgressSub?.unsubscribe();
    this.#dailyStatsSub?.unsubscribe();
    this.#weeklyStatsSub?.unsubscribe();
    this.#dailyLeaderboardSub?.unsubscribe();
    this.#weeklyLeaderboardSub?.unsubscribe();
    this.#highlightsSub?.unsubscribe();
    this.#badgesSub?.unsubscribe();
  }

  onPeriodChange(period: Period) {
    this.selectedPeriod.set(period);
    this.#updateLeaderboardForPeriod();
  }

  #updateLeaderboardForPeriod() {
    if (this.selectedPeriod() === 'day') {
      this.leaderboardEntries.set(this.dailyLeaderboard());
      this.currentUserRank.set(this.dailyUserRank());
    } else {
      this.leaderboardEntries.set(this.weeklyLeaderboard());
      this.currentUserRank.set(this.weeklyUserRank());
    }
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

    // Load daily stats
    this.#dailyStatsSub = this.#hqDataService.getDailyStats().subscribe({
      next: (stats) => {
        this.dailyStats.set(stats);
        this.#checkLoadingComplete();
      },
      error: (error) => {
        console.error('Failed to load daily stats:', error);
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

    // Load daily leaderboard
    this.#dailyLeaderboardSub = this.#hqDataService.getDailyLeaderboard(5).subscribe({
      next: ({ entries, currentUserRank, currentUserId }) => {
        this.dailyLeaderboard.set(entries);
        this.dailyUserRank.set(currentUserRank);
        if (!this.currentUserId()) {
          this.currentUserId.set(currentUserId);
        }
        this.#updateLeaderboardForPeriod();
        this.#checkLoadingComplete();
      },
      error: (error) => {
        console.error('Failed to load daily leaderboard:', error);
        this.#checkLoadingComplete();
      },
    });

    // Load weekly leaderboard
    this.#weeklyLeaderboardSub = this.#hqDataService.getWeeklyLeaderboard(5).subscribe({
      next: ({ entries, currentUserRank, currentUserId }) => {
        this.weeklyLeaderboard.set(entries);
        this.weeklyUserRank.set(currentUserRank);
        if (!this.currentUserId()) {
          this.currentUserId.set(currentUserId);
        }
        this.#updateLeaderboardForPeriod();
        this.leaderboardLoading.set(false);
        this.#checkLoadingComplete();
      },
      error: (error) => {
        console.error('Failed to load weekly leaderboard:', error);
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

    // Load badges
    this.#badgesSub = this.#hqDataService.getUserBadges().subscribe({
      next: (badges) => {
        this.badges.set(badges);
        this.#checkLoadingComplete();
      },
      error: (error) => {
        console.error('Failed to load badges:', error);
        this.#checkLoadingComplete();
      },
    });
  }

  #loadCount = 0;

  #checkLoadingComplete() {
    this.#loadCount++;
    // All data sources have responded
    if (this.#loadCount >= this.#EXPECTED_DATA_SOURCES) {
      this.isLoading.set(false);
    }
  }
}
