import { Component, inject, signal, HostListener, OnInit, OnDestroy } from '@angular/core';

import { Auth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, Unsubscribe } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { Activity } from '@codeheroes/types';
import { ActivityFeedService } from './core/services/activity-feed.service';
import { UserCacheService } from './core/services/user-cache.service';
import { ActivityItemComponent } from './components/activity-item.component';
import { DebugPanelComponent } from './components/debug-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ActivityItemComponent, DebugPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  readonly #auth = inject(Auth);
  readonly #activityFeedService = inject(ActivityFeedService);
  readonly #userCacheService = inject(UserCacheService);

  // Cleanup references
  #authUnsubscribe: Unsubscribe | null = null;
  #activitiesSubscription: Subscription | null = null;
  #isLoadingData = false;

  activities = signal<Activity[]>([]);
  selectedActivity = signal<Activity | null>(null);
  debugPanelOpen = signal(false);
  isLoading = signal(true);
  isAuthenticated = signal(false);

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
