import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
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
  readonly #activityFeedService = inject(ActivityFeedService);
  readonly #userCacheService = inject(UserCacheService);

  activities = toSignal(this.#activityFeedService.getGlobalActivities(100), {
    initialValue: [],
  });

  selectedActivity = signal<Activity | null>(null);
  debugPanelOpen = signal(false);
  isLoading = signal(true);

  async ngOnInit() {
    await this.#userCacheService.loadUsers();
    this.isLoading.set(false);
  }

  getUserInfo(userId: string) {
    return this.#userCacheService.getUserInfo(userId);
  }

  onSelectActivity(activity: Activity) {
    this.selectedActivity.set(activity);
    if (!this.debugPanelOpen()) {
      this.debugPanelOpen.set(true);
    }
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
