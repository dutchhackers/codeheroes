import { Component, DestroyRef, ElementRef, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, switchMap, take } from 'rxjs';
import { OnboardingService } from '../../core/services/onboarding.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { NotificationDataService } from '../../core/services/notification-data.service';
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
import { registerWebMcpTools } from '../../core/webmcp/model-context';
import { createExplainXpTool } from '../../core/webmcp/code-heroes-tools';
import { WebMcpPeriod } from '../../core/webmcp/webmcp-format';

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
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 md:px-6 lg:px-8 py-3 md:py-5">
      <div class="relative z-10 flex items-center justify-between">
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">HQ</h1>
        <button type="button" class="bell-button" (click)="openNotifications()" aria-label="Notifications">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          @if (unreadCount() > 0) {
            <span class="badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
          }
        </button>
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
      } @else {
        <div class="max-w-2xl mx-auto py-2 md:py-6">
          <!-- Daily Progress -->
          <app-daily-progress
            data-webmcp-card="day"
            [class.webmcp-focus]="focusedCard() === 'day'"
            [progress]="dailyProgress()"
          />

          <!-- Weekly Stats -->
          <app-weekly-stats
            data-webmcp-card="week"
            [class.webmcp-focus]="focusedCard() === 'week'"
            [stats]="weeklyStats()"
          />

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
      .webmcp-focus {
        display: block;
        border-radius: 12px;
        outline: 2px solid var(--neon-cyan);
        outline-offset: 4px;
        transition: outline-color 0.3s;
      }

      :host {
        display: block;
      }

      .bell-button {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        transition: all 0.2s;
      }

      .bell-button:hover {
        color: white;
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.1);
      }

      .badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 9px;
        background: rgb(239, 68, 68);
        color: white;
        font-size: 0.6875rem;
        font-weight: 700;
        line-height: 18px;
        text-align: center;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
      }
    `,
  ],
})
export class HqComponent implements OnInit, OnDestroy {
  readonly #hqDataService = inject(HqDataService);
  readonly #userSettingsService = inject(UserSettingsService);
  readonly #notificationService = inject(NotificationDataService);
  readonly #onboardingService = inject(OnboardingService);
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  #focusTimer: ReturnType<typeof setTimeout> | null = null;

  #dailyProgressSub: Subscription | null = null;
  #weeklyStatsSub: Subscription | null = null;
  #leaderboardSub: Subscription | null = null;
  #highlightsSub: Subscription | null = null;
  #notificationSub: Subscription | null = null;

  isLoading = signal(true);
  unreadCount = signal(0);
  dailyProgress = signal<DailyProgress | null>(null);
  weeklyStats = signal<WeeklyStats | null>(null);
  leaderboardLoading = signal(true);
  currentUserRank = signal<number | null>(null);
  highlights = signal<Highlight[]>([]);
  /** HQ card highlighted by the explain_xp WebMCP tool. */
  focusedCard = signal<WebMcpPeriod | null>(null);

  ngOnInit() {
    // Check if onboarding should be shown (one-time check)
    this.#onboardingService.shouldShowOnboarding$.pipe(take(1)).subscribe((shouldShow) => {
      if (shouldShow) {
        this.#router.navigate(['/onboarding']);
        return;
      }
    });

    this.#notificationSub = this.#notificationService.unreadCount$.subscribe((count) =>
      this.unreadCount.set(count),
    );
    this.#loadData();
    this.#registerWebMcpTools();
  }

  ngOnDestroy() {
    if (this.#focusTimer) clearTimeout(this.#focusTimer);
    this.#dailyProgressSub?.unsubscribe();
    this.#weeklyStatsSub?.unsubscribe();
    this.#leaderboardSub?.unsubscribe();
    this.#highlightsSub?.unsubscribe();
    this.#notificationSub?.unsubscribe();
  }

  openNotifications(): void {
    this.#router.navigate(['/notifications']);
  }

  #registerWebMcpTools() {
    registerWebMcpTools(
      [
        createExplainXpTool({
          isLoading: () => this.isLoading(),
          snapshot: () => ({
            daily: this.dailyProgress(),
            weekly: this.weeklyStats(),
            weeklyRank: this.currentUserRank(),
          }),
          reveal: (period) => this.#focusCard(period),
        }),
      ],
      this.#destroyRef,
    );
  }

  #focusCard(period: WebMcpPeriod) {
    this.focusedCard.set(period);
    setTimeout(() =>
      this.#host.nativeElement
        .querySelector(`[data-webmcp-card="${period}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
    if (this.#focusTimer) clearTimeout(this.#focusTimer);
    this.#focusTimer = setTimeout(() => this.focusedCard.set(null), 4000);
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
