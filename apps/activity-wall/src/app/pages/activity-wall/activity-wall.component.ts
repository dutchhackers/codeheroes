import { Component, inject, signal, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Activity } from '@codeheroes/types';
import { ActivityFeedService } from '../../core/services/activity-feed.service';
import { UserCacheService } from '../../core/services/user-cache.service';
import { ActivityItemComponent } from '../../components/activity-item.component';
import { DebugPanelComponent } from '../../components/debug-panel.component';

@Component({
  selector: 'app-activity-wall',
  standalone: true,
  imports: [ActivityItemComponent, DebugPanelComponent],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-8 md:py-5">
      <div class="flex items-center justify-between relative z-10">
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">
          Activity Wall
        </h1>
        <div class="flex items-center gap-2 px-3 py-1.5 rounded border border-green-500/30 bg-black/50">
          <span class="w-2.5 h-2.5 rounded-full bg-green-400 live-indicator"></span>
          <span class="text-sm md:text-base text-green-400 font-mono">LIVE</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-3 md:px-6 lg:px-8 pb-24">
      @if (isLoading()) {
        <div class="flex items-center justify-center py-20 md:py-32">
          <div class="text-xl md:text-2xl text-purple-400/70 animate-pulse font-mono">Loading...</div>
        </div>
      } @else if (activities().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 md:py-32">
          <p class="text-lg md:text-2xl text-slate-500 font-mono">No activities yet</p>
          <p class="text-sm md:text-lg mt-3 text-slate-600 font-mono">Awaiting activity stream...</p>
        </div>
      } @else {
        <div class="py-6 flex flex-col gap-6 md:gap-8 lg:gap-10">
          @for (activity of activities(); track activity.id; let i = $index) {
            <app-activity-item
              [activity]="activity"
              [userInfo]="getUserInfo(activity.userId)"
              [isNew]="i === 0"
              (selectActivity)="onSelectActivity($event)"
            />
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
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class ActivityWallComponent implements OnInit, OnDestroy {
  readonly #activityFeedService = inject(ActivityFeedService);
  readonly #userCacheService = inject(UserCacheService);

  #activitiesSubscription: Subscription | null = null;
  #isLoadingData = false;

  activities = signal<Activity[]>([]);
  selectedActivity = signal<Activity | null>(null);
  debugPanelOpen = signal(false);
  isLoading = signal(true);

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
          this.activities.set(activities);
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

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key.toLowerCase() === 'd' && !event.ctrlKey && !event.metaKey) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      this.toggleDebugPanel();
    }
  }
}
