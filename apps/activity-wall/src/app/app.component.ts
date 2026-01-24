import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from '@angular/fire/auth';
import { Activity } from '@codeheroes/types';
import { ActivityFeedService } from './core/services/activity-feed.service';
import { UserCacheService } from './core/services/user-cache.service';
import { ActivityItemComponent } from './components/activity-item.component';
import { DebugPanelComponent } from './components/debug-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ActivityItemComponent, DebugPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  readonly #auth = inject(Auth);
  readonly #activityFeedService = inject(ActivityFeedService);
  readonly #userCacheService = inject(UserCacheService);

  activities = signal<Activity[]>([]);
  selectedActivity = signal<Activity | null>(null);
  debugPanelOpen = signal(false);
  isLoading = signal(true);
  isAuthenticated = signal(false);

  ngOnInit() {
    onAuthStateChanged(this.#auth, async (user) => {
      if (user) {
        this.isAuthenticated.set(true);
        await this.#loadData();
      } else {
        this.isAuthenticated.set(false);
        this.isLoading.set(false);
      }
    });
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.#auth, provider);
  }

  async #loadData() {
    await this.#userCacheService.loadUsers();

    this.#activityFeedService.getGlobalActivities(100).subscribe((activities) => {
      this.activities.set(activities);
    });

    this.isLoading.set(false);
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
