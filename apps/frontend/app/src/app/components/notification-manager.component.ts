import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '../core/services/notification.service';
import { UserStatsService } from '../core/services/user-stats.service';
import { Notification } from '@codeheroes/types';
import { LevelUpPopupComponent } from './level-up-popup.component';

@Component({
  selector: 'app-notification-manager',
  standalone: true,
  imports: [LevelUpPopupComponent],
  template: `
    @if (showLevelUpPopup()) {
      <app-level-up-popup
        [level]="currentLevelUpLevel()"
        [message]="currentLevelUpMessage()"
        (dismiss)="closeLevelUpPopup()"
      />
    }
  `,
  styles: [],
})
export class NotificationManagerComponent implements OnInit, OnDestroy {
  readonly #notificationService = inject(NotificationService);
  readonly #userStatsService = inject(UserStatsService);
  
  #notificationSubscription: Subscription | null = null;
  #processedNotifications = new Set<string>();

  showLevelUpPopup = signal(false);
  currentLevelUpLevel = signal(1);
  currentLevelUpMessage = signal('');

  ngOnInit() {
    // Check if notifications are enabled in user preferences
    this.#userStatsService.getCurrentUserDoc().subscribe((userDoc) => {
      if (!userDoc) return;
      
      const notificationsEnabled = userDoc.preferences?.notificationsEnabled ?? true;
      
      if (!notificationsEnabled) {
        // User has disabled notifications, don't subscribe
        return;
      }
      
      // Subscribe to notifications
      this.#notificationSubscription = this.#notificationService
        .getCurrentUserUnreadNotifications()
        .subscribe((notifications) => {
          this.#handleNewNotifications(notifications);
        });
    });
  }

  ngOnDestroy() {
    this.#notificationSubscription?.unsubscribe();
  }

  #handleNewNotifications(notifications: Notification[]) {
    // Find new LEVEL_UP notifications that haven't been processed yet
    const newLevelUpNotifications = notifications
      .filter(
        (n) => n.type === 'LEVEL_UP' && !this.#processedNotifications.has(n.id)
      )
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    if (newLevelUpNotifications.length === 0) return;

    // Show the most recent level-up notification
    const notification = newLevelUpNotifications[0];
    this.#processedNotifications.add(notification.id);

    const level = (notification.metadata?.level as number) || 1;
    this.currentLevelUpLevel.set(level);
    this.currentLevelUpMessage.set(notification.message);
    this.showLevelUpPopup.set(true);

    // Mark this notification as read
    this.#notificationService.markOneAsRead(notification.id).catch((error) => {
      console.error('Failed to mark notification as read:', error);
    });
  }

  closeLevelUpPopup() {
    this.showLevelUpPopup.set(false);
  }
}
