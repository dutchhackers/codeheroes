import { Component, inject, signal, computed, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Activity } from '@codeheroes/types';
import { ActivityFeedService } from '../../core/services/activity-feed.service';
import { UserCacheService } from '../../core/services/user-cache.service';
import { ActivityStackerService } from '../../core/services/activity-stacker.service';
import { FeedItem, isActivityStack, isSingleActivity } from '../../core/models/activity-stack.model';
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
      } @else if (feedItems().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 md:py-32">
          <p class="text-lg md:text-2xl text-slate-500">No activities yet</p>
          <p class="text-sm md:text-lg mt-3 text-slate-600">Awaiting activity stream...</p>
        </div>
      } @else {
        <div class="py-6 flex flex-col gap-6 md:gap-8 lg:gap-10">
          @for (item of feedItems(); track trackFeedItem(item); let i = $index) {
            @if (isStack(item)) {
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
    `,
  ],
})
export class ActivityWallComponent implements OnInit, OnDestroy {
  readonly #activityFeedService = inject(ActivityFeedService);
  readonly #userCacheService = inject(UserCacheService);
  readonly #activityStacker = inject(ActivityStackerService);

  #activitiesSubscription: Subscription | null = null;
  #isLoadingData = false;

  #activities = signal<Activity[]>([]);
  selectedActivity = signal<Activity | null>(null);
  debugPanelOpen = signal(false);
  isLoading = signal(true);

  // Computed stacked feed items
  feedItems = computed(() => {
    const activities = this.#activities();
    return this.#activityStacker.stackActivities(activities);
  });

  // Type guards exposed for template
  readonly isStack = isActivityStack;
  readonly isSingle = isSingleActivity;

  ngOnInit() {
    this.#loadData();
  }

  ngOnDestroy() {
    if (this.#activitiesSubscription) {
      this.#activitiesSubscription.unsubscribe();
    }
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
    if (item.type === 'stack') {
      return item.id;
    }
    return item.activity.id;
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
