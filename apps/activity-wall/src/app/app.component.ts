import { Component, inject, signal, computed, HostListener, OnInit, OnDestroy } from '@angular/core';

import { Auth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, Unsubscribe } from '@angular/fire/auth';
import { QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { Activity } from '@codeheroes/types';
import { ActivityFeedService } from './core/services/activity-feed.service';
import { UserCacheService } from './core/services/user-cache.service';
import { ActivityStackerService } from './core/services/activity-stacker.service';
import { FeedItem, isActivityStack, isSingleActivity } from './core/models/activity-stack.model';
import { ActivityItemComponent } from './components/activity-item.component';
import { ActivityStackComponent } from './components/activity-stack/activity-stack.component';
import { DebugPanelComponent } from './components/debug-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ActivityItemComponent, ActivityStackComponent, DebugPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  readonly #auth = inject(Auth);
  readonly #activityFeedService = inject(ActivityFeedService);
  readonly #userCacheService = inject(UserCacheService);
  readonly #activityStacker = inject(ActivityStackerService);

  // Cleanup references
  #authUnsubscribe: Unsubscribe | null = null;
  #activitiesSubscription: Subscription | null = null;
  #isLoadingData = false;

  // Activity state
  #liveActivities = signal<Activity[]>([]);
  #historicalActivities = signal<Activity[]>([]);
  #lastDoc = signal<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Combined and stacked feed items
  feedItems = computed(() => {
    const live = this.#liveActivities();
    const historical = this.#historicalActivities();

    // Combine and deduplicate by activity ID
    const allActivities = [...live];
    const liveIds = new Set(live.map((a) => a.id));

    for (const activity of historical) {
      if (!liveIds.has(activity.id)) {
        allActivities.push(activity);
      }
    }

    // Sort by createdAt desc
    allActivities.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return this.#activityStacker.stackActivities(allActivities);
  });

  selectedActivity = signal<Activity | null>(null);
  debugPanelOpen = signal(false);
  isLoading = signal(true);
  isAuthenticated = signal(false);
  isLoadingMore = signal(false);
  hasMore = signal(true);

  // Type guards exposed for template
  readonly isStack = isActivityStack;
  readonly isSingle = isSingleActivity;

  ngOnInit() {
    this.#authUnsubscribe = onAuthStateChanged(this.#auth, async (user) => {
      if (user) {
        this.isAuthenticated.set(true);
        await this.#loadData();
      } else {
        this.isAuthenticated.set(false);
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy() {
    // Clean up auth listener
    if (this.#authUnsubscribe) {
      this.#authUnsubscribe();
    }
    // Clean up activities subscription
    if (this.#activitiesSubscription) {
      this.#activitiesSubscription.unsubscribe();
    }
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(this.#auth, provider);
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  }

  async #loadData() {
    // Guard against concurrent loads
    if (this.#isLoadingData) {
      return;
    }
    this.#isLoadingData = true;

    try {
      await this.#userCacheService.loadUsers();

      // Clean up previous subscription before creating new one
      if (this.#activitiesSubscription) {
        this.#activitiesSubscription.unsubscribe();
      }

      this.#activitiesSubscription = this.#activityFeedService
        .getGlobalActivities(50)
        .subscribe({
          next: async (activities) => {
            this.#liveActivities.set(activities);

            // Get cursor for pagination from the last live activity
            if (activities.length > 0 && !this.#lastDoc()) {
              const lastActivity = activities[activities.length - 1];
              const doc = await this.#activityFeedService.getDocumentForActivity(
                lastActivity.id,
                lastActivity.userId
              );
              if (doc) {
                this.#lastDoc.set(doc);
              }
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

  async loadMore() {
    const lastDoc = this.#lastDoc();
    if (!lastDoc || this.isLoadingMore()) {
      return;
    }

    this.isLoadingMore.set(true);

    try {
      const result = await this.#activityFeedService.loadMoreActivities(lastDoc, 50);

      // Append to historical activities
      this.#historicalActivities.update((current) => [...current, ...result.activities]);

      // Update cursor and hasMore flag
      if (result.lastDoc) {
        this.#lastDoc.set(result.lastDoc);
      }
      this.hasMore.set(result.hasMore);
    } catch (error) {
      console.error('Failed to load more activities:', error);
    } finally {
      this.isLoadingMore.set(false);
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
      // Don't toggle if user is typing in an input
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
