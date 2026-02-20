import { Component, inject, signal, computed, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Auth, user } from '@angular/fire/auth';
import { QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore';
import { Activity } from '@codeheroes/types';
import { ActivityFeedService, LoadMoreResult } from '../../core/services/activity-feed.service';
import { UserCacheService } from '../../core/services/user-cache.service';
import { ActivityStackerService } from '../../core/services/activity-stacker.service';
import { FeedItem, isActivityStack, isSingleActivity, isDateSeparator } from '../../core/models/activity-stack.model';
import { ActivityItemComponent } from '../../components/activity-item.component';
import { ActivityStackComponent } from '../../components/activity-stack/activity-stack.component';
import { DebugPanelComponent } from '../../components/debug-panel.component';

@Component({
  selector: 'app-activity-wall',
  standalone: true,
  imports: [ActivityItemComponent, ActivityStackComponent, DebugPanelComponent],
  template: `
    <!-- Header (desktop only - bottom nav identifies the tab on mobile) -->
    <header class="hidden md:block sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-8 py-5">
      <div class="relative z-10">
        <h1 class="text-4xl font-bold italic text-white">Activity Wall</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-3 pt-4 md:px-6 md:pt-0 lg:px-8 pb-24">
      @if (isLoading()) {
        <div class="flex items-center justify-center py-20 md:py-32">
          <div class="text-xl md:text-2xl text-purple-400/70 animate-pulse" role="status" aria-live="polite">
            Loading...
          </div>
        </div>
      } @else {
        <!-- Filter Tabs -->
        <div class="max-w-2xl mx-auto pt-4 md:pt-6">
          <div class="filter-tabs">
            <button
              type="button"
              class="filter-tab"
              [class.filter-tab-active]="activeFilter() === 'all'"
              (click)="activeFilter.set('all')"
            >All</button>
            <button
              type="button"
              class="filter-tab"
              [class.filter-tab-active]="activeFilter() === 'mine'"
              (click)="activeFilter.set('mine')"
            >My Activity</button>
            <button
              type="button"
              class="bot-toggle"
              [class.bot-toggle-hidden]="!showBots()"
              (click)="toggleBots()"
              [attr.aria-label]="showBots() ? 'Hide bot activity' : 'Show bot activity'"
              [attr.title]="showBots() ? 'Hide bots' : 'Show bots'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="8" width="18" height="12" rx="2" stroke-width="2" />
                <circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" />
                <path stroke-linecap="round" stroke-width="2" d="M12 2v6M7 2h10" />
              </svg>
            </button>
          </div>
        </div>

        @if (displayItems().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 md:py-32">
            @if (activeFilter() === 'mine') {
              <p class="text-lg md:text-2xl text-slate-500">No activity yet</p>
              <p class="text-sm md:text-lg mt-3 text-slate-600">Start coding to see your activity here!</p>
            } @else if (!showBots()) {
              <p class="text-lg md:text-2xl text-slate-500">No human activity yet</p>
              <p class="text-sm md:text-lg mt-3 text-slate-600">Toggle the bot filter to see all activity</p>
            } @else {
              <p class="text-lg md:text-2xl text-slate-500">No activities yet</p>
              <p class="text-sm md:text-lg mt-3 text-slate-600">Awaiting activity stream...</p>
            }
          </div>
        } @else {
          <div class="max-w-2xl mx-auto py-6 flex flex-col gap-6 md:gap-8 lg:gap-10">
            @for (item of displayItems(); track trackFeedItem(item); let i = $index) {
              @if (isDateSep(item)) {
                <div class="date-separator">
                  <span class="date-separator-label">{{ item.label }}</span>
                </div>
              } @else if (isStack(item)) {
                <app-activity-stack [stack]="item" [isNew]="i === 0 || (i === 1 && isDateSep(displayItems()[0]))" (selectActivity)="onSelectActivity($event)" />
              } @else if (isSingle(item)) {
                <app-activity-item
                  [activity]="item.activity"
                  [userInfo]="getUserInfo(item.activity.userId)"
                  [isNew]="i === 0 || (i === 1 && isDateSep(displayItems()[0]))"
                  (selectActivity)="onSelectActivity($event)"
                />
              }
            }

            @if (hasMore() && !isLoadingMore()) {
              <div class="flex justify-center pt-4 pb-2">
                <button type="button" class="load-more-button" (click)="loadMore()">
                  Load More
                </button>
              </div>
            }
            @if (isLoadingMore()) {
              <div class="flex justify-center pt-4 pb-2">
                <div class="text-sm text-purple-400/70 animate-pulse">Loading more...</div>
              </div>
            }
          </div>
        }
      }
    </main>

    <!-- Debug Panel -->
    <app-debug-panel
      [isOpen]="debugPanelOpen()"
      [selectedActivity]="selectedActivity()"
      (togglePanel)="toggleDebugPanel()"
    />
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .filter-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .filter-tab {
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: rgba(0, 0, 0, 0.3);
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .filter-tab:hover {
        border-color: rgba(6, 182, 212, 0.5);
        color: white;
      }

      .filter-tab-active {
        border-color: var(--neon-cyan);
        background: rgba(6, 182, 212, 0.15);
        color: var(--neon-cyan);
        box-shadow: 0 0 12px rgba(6, 182, 212, 0.2);
      }

      .bot-toggle {
        margin-left: auto;
        padding: 0.5rem;
        border-radius: 9999px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: rgba(6, 182, 212, 0.15);
        color: var(--neon-cyan);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        min-height: 36px;
      }

      .bot-toggle:hover {
        border-color: var(--neon-cyan);
        box-shadow: 0 0 12px rgba(6, 182, 212, 0.2);
      }

      .bot-toggle-hidden {
        background: rgba(0, 0, 0, 0.3);
        color: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .date-separator {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 0.5rem 0;
      }

      .date-separator::before,
      .date-separator::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
      }

      .date-separator-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        white-space: nowrap;
      }

      .load-more-button {
        padding: 0.625rem 1.5rem;
        border-radius: 9999px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: rgba(0, 0, 0, 0.3);
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .load-more-button:hover {
        border-color: var(--neon-cyan);
        color: var(--neon-cyan);
        box-shadow: 0 0 12px rgba(6, 182, 212, 0.2);
      }
    `,
  ],
})
export class ActivityWallComponent implements OnInit, OnDestroy {
  readonly #activityFeedService = inject(ActivityFeedService);
  readonly #userCacheService = inject(UserCacheService);
  readonly #activityStacker = inject(ActivityStackerService);
  readonly #auth = inject(Auth);

  readonly #INITIAL_LIMIT = 200;
  readonly #LOAD_MORE_LIMIT = 100;

  #activitiesSubscription: Subscription | null = null;
  #authSubscription: Subscription | null = null;
  #isLoadingData = false;
  #lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

  #activities = signal<Activity[]>([]);
  #olderActivities = signal<Activity[]>([]);
  #currentUserId = signal<string | null>(null);
  selectedActivity = signal<Activity | null>(null);
  debugPanelOpen = signal(false);
  isLoading = signal(true);
  isLoadingMore = signal(false);
  hasMore = signal(true);
  activeFilter = signal<'all' | 'mine'>('all');
  showBots = signal(true);

  // Combined activities (real-time + loaded more)
  #allActivities = computed(() => {
    const realtime = this.#activities();
    const older = this.#olderActivities();
    if (older.length === 0) return realtime;
    // Deduplicate by id, real-time takes priority
    const seenIds = new Set(realtime.map((a) => a.id));
    const uniqueOlder = older.filter((a) => !seenIds.has(a.id));
    return [...realtime, ...uniqueOlder];
  });

  // Computed stacked feed items
  feedItems = computed(() => {
    const activities = this.#allActivities();
    return this.#activityStacker.stackActivities(activities);
  });

  // Filtered + date-separated feed items
  displayItems = computed<FeedItem[]>(() => {
    const items = this.feedItems();
    const filter = this.activeFilter();
    const currentUserId = this.#currentUserId();
    const includeBots = this.showBots();

    // Apply filter
    let filtered = items;
    if (filter === 'mine') {
      if (!currentUserId) {
        filtered = [];
      } else {
        filtered = items.filter((item) => {
          if (isSingleActivity(item)) return item.activity.userId === currentUserId;
          if (isActivityStack(item)) return item.activities.some((a) => a.userId === currentUserId);
          return false;
        });
      }
    }

    // Filter out bot activities when showBots is false
    if (!includeBots) {
      filtered = filtered.filter((item) => {
        if (isSingleActivity(item)) {
          const userInfo = this.#userCacheService.getUserInfo(item.activity.userId);
          return !userInfo || userInfo.userType !== 'bot';
        }
        if (isActivityStack(item)) {
          // Hide stack only if ALL activities are from bots (mixed stacks with human activity are kept)
          const allBots = item.activities.every((a) => {
            const userInfo = this.#userCacheService.getUserInfo(a.userId);
            return userInfo?.userType === 'bot';
          });
          return !allBots;
        }
        return true;
      });
    }

    // Insert date separators
    return this.#insertDateSeparators(filtered);
  });

  // Type guards exposed for template
  readonly isStack = isActivityStack;
  readonly isSingle = isSingleActivity;
  readonly isDateSep = isDateSeparator;

  ngOnInit() {
    this.#loadData();
    // Track current user for "My Activity" filter
    this.#authSubscription = user(this.#auth).subscribe((authUser) => {
      this.#currentUserId.set(authUser?.uid ?? null);
    });
  }

  ngOnDestroy() {
    this.#activitiesSubscription?.unsubscribe();
    this.#authSubscription?.unsubscribe();
  }

  async #loadData() {
    if (this.#isLoadingData) {
      return;
    }
    this.#isLoadingData = true;

    try {
      await this.#userCacheService.loadUsers();

      if (this.#activitiesSubscription) {
        this.#activitiesSubscription.unsubscribe();
      }

      this.#activitiesSubscription = this.#activityFeedService.getGlobalActivities(this.#INITIAL_LIMIT).subscribe({
        next: (activities) => {
          this.#activities.set(activities);
          // If we got fewer than the limit, there are no more to load
          if (activities.length < this.#INITIAL_LIMIT) {
            this.hasMore.set(false);
          }
        },
        error: (error) => {
          console.error('Failed to load activities:', error);
        },
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      this.isLoading.set(false);
      this.#isLoadingData = false;
    }
  }

  getUserInfo(userId: string) {
    return this.#userCacheService.getUserInfo(userId);
  }

  onSelectActivity(activity: Activity) {
    this.selectedActivity.set(activity);
  }

  toggleBots() {
    this.showBots.update((v) => !v);
  }

  toggleDebugPanel() {
    this.debugPanelOpen.update((open) => !open);
  }

  async loadMore() {
    if (this.isLoadingMore() || !this.hasMore()) return;

    // Get the last activity from real-time list to use as cursor
    const allActivities = this.#allActivities();
    const lastActivity = allActivities[allActivities.length - 1];
    if (!lastActivity) return;

    this.isLoadingMore.set(true);
    try {
      // Get the document snapshot for the last activity
      const lastDoc = await this.#activityFeedService.getDocumentForActivity(lastActivity.id, lastActivity.userId);
      if (!lastDoc) {
        this.hasMore.set(false);
        return;
      }

      const result = await this.#activityFeedService.loadMoreActivities(lastDoc, this.#LOAD_MORE_LIMIT);
      this.#olderActivities.update((existing) => [...existing, ...result.activities]);
      this.hasMore.set(result.hasMore);
    } catch (error) {
      console.error('Failed to load more activities:', error);
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  trackFeedItem(item: FeedItem): string {
    if (item.type === 'stack') return item.id;
    if (item.type === 'date-separator') return `sep-${item.date}`;
    return item.activity.id;
  }

  #insertDateSeparators(items: FeedItem[]): FeedItem[] {
    if (items.length === 0) return items;

    const result: FeedItem[] = [];
    let lastDate = '';

    for (const item of items) {
      const timestamp = this.#getFeedItemTimestamp(item);
      if (!timestamp) {
        result.push(item);
        continue;
      }

      const itemDate = timestamp.slice(0, 10); // YYYY-MM-DD
      if (itemDate !== lastDate) {
        result.push({ type: 'date-separator', date: itemDate, label: this.#formatDateLabel(itemDate) });
        lastDate = itemDate;
      }
      result.push(item);
    }

    return result;
  }

  #getFeedItemTimestamp(item: FeedItem): string | null {
    if (item.type === 'single') return item.activity.createdAt;
    if (item.type === 'stack') return item.lastUpdatedAt;
    return null;
  }

  #formatDateLabel(dateStr: string): string {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';

    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key.toLowerCase() === 'd' && !event.ctrlKey && !event.metaKey) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      this.toggleDebugPanel();
    }
  }
}
