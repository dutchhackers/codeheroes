import { Component, inject, signal, computed, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Auth, user } from '@angular/fire/auth';
import { Activity } from '@codeheroes/types';
import { ActivityFeedService } from '../../core/services/activity-feed.service';
import { UserCacheService } from '../../core/services/user-cache.service';
import { ActivityStackerService } from '../../core/services/activity-stacker.service';
import { FeedItem, DateSeparator, isActivityStack, isSingleActivity, isDateSeparator } from '../../core/models/activity-stack.model';
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
          </div>
        </div>

        @if (displayItems().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 md:py-32">
            <p class="text-lg md:text-2xl text-slate-500">No activities yet</p>
            <p class="text-sm md:text-lg mt-3 text-slate-600">
              {{ activeFilter() === 'mine' ? 'You haven\'t logged any activities yet' : 'Awaiting activity stream...' }}
            </p>
          </div>
        } @else {
          <div class="max-w-2xl mx-auto py-6 flex flex-col gap-6 md:gap-8 lg:gap-10">
            @for (item of displayItems(); track trackFeedItem(item); let i = $index) {
              @if (isDateSep(item)) {
                <div class="date-separator">
                  <span class="date-separator-label">{{ item.label }}</span>
                </div>
              } @else if (isStack(item)) {
                <app-activity-stack [stack]="item" [isNew]="i === 0" (selectActivity)="onSelectActivity($event)" />
              } @else if (isSingle(item)) {
                <app-activity-item
                  [activity]="item.activity"
                  [userInfo]="getUserInfo(item.activity.userId)"
                  [isNew]="i === 0"
                  (selectActivity)="onSelectActivity($event)"
                />
              }
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
    `,
  ],
})
export class ActivityWallComponent implements OnInit, OnDestroy {
  readonly #activityFeedService = inject(ActivityFeedService);
  readonly #userCacheService = inject(UserCacheService);
  readonly #activityStacker = inject(ActivityStackerService);
  readonly #auth = inject(Auth);

  #activitiesSubscription: Subscription | null = null;
  #authSubscription: Subscription | null = null;
  #isLoadingData = false;

  #activities = signal<Activity[]>([]);
  #currentUserId = signal<string | null>(null);
  selectedActivity = signal<Activity | null>(null);
  debugPanelOpen = signal(false);
  isLoading = signal(true);
  activeFilter = signal<'all' | 'mine'>('all');

  // Computed stacked feed items
  feedItems = computed(() => {
    const activities = this.#activities();
    return this.#activityStacker.stackActivities(activities);
  });

  // Filtered + date-separated feed items
  displayItems = computed<FeedItem[]>(() => {
    const items = this.feedItems();
    const filter = this.activeFilter();
    const currentUserId = this.#currentUserId();

    // Apply filter
    let filtered = items;
    if (filter === 'mine' && currentUserId) {
      filtered = items.filter((item) => {
        if (isSingleActivity(item)) return item.activity.userId === currentUserId;
        if (isActivityStack(item)) return item.activities.some((a) => a.userId === currentUserId);
        return false;
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

      this.#activitiesSubscription = this.#activityFeedService.getGlobalActivities(100).subscribe({
        next: (activities) => {
          this.#activities.set(activities);
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

  toggleDebugPanel() {
    this.debugPanelOpen.update((open) => !open);
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
