import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Notification, NotificationType } from '@codeheroes/types';
import { NotificationDataService } from '../../core/services/notification-data.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  template: `
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="flex items-center gap-3 relative z-10">
        <button type="button" (click)="goBack()" aria-label="Go back" class="back-button">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl md:text-4xl font-bold italic text-white flex-1">Notifications</h1>
        @if (hasUnread()) {
          <button type="button" class="mark-all-btn" (click)="markAllAsRead()">Mark all read</button>
        }
      </div>
    </header>

    <main class="relative z-10 px-4 md:px-6 lg:px-8 pb-24">
      <div class="max-w-2xl mx-auto py-4">
        @if (notifications().length === 0) {
          <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <p>No notifications yet</p>
          </div>
        } @else {
          <div class="notification-list">
            @for (notification of notifications(); track notification.id) {
              <button
                type="button"
                class="notification-item"
                [class.unread]="!notification.read"
                (click)="onNotificationClick(notification)"
              >
                <div class="notification-icon" [innerHTML]="getIcon(notification.type)"></div>
                <div class="notification-content">
                  <p class="notification-title">{{ notification.title }}</p>
                  <p class="notification-message">{{ notification.message }}</p>
                  <span class="notification-time">{{ getRelativeTime(notification.createdAt) }}</span>
                </div>
                @if (!notification.read) {
                  <div class="unread-dot"></div>
                }
              </button>
            }
          </div>
        }
      </div>
    </main>
  `,
  styles: [
    `
      :host { display: block; }

      .back-button {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 0.5rem;
        min-width: 40px;
        min-height: 40px;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .back-button:hover {
        color: white;
        border-color: rgba(255, 255, 255, 0.4);
      }

      .mark-all-btn {
        padding: 0.375rem 0.875rem;
        border-radius: 6px;
        border: 1px solid rgba(6, 182, 212, 0.3);
        background: rgba(6, 182, 212, 0.1);
        color: var(--neon-cyan, #00f5ff);
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .mark-all-btn:hover {
        background: rgba(6, 182, 212, 0.2);
        border-color: rgba(6, 182, 212, 0.5);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 4rem 1rem;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.9375rem;
      }

      .empty-icon {
        width: 48px;
        height: 48px;
        opacity: 0.4;
      }

      .notification-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .notification-item {
        display: flex;
        align-items: flex-start;
        gap: 0.875rem;
        padding: 1rem;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.05);
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        width: 100%;
        color: inherit;
      }

      .notification-item:hover {
        background: rgba(139, 92, 246, 0.08);
        border-color: rgba(139, 92, 246, 0.2);
      }

      .notification-item.unread {
        background: rgba(6, 182, 212, 0.05);
        border-color: rgba(6, 182, 212, 0.15);
      }

      .notification-icon {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(139, 92, 246, 0.15);
        color: rgb(167, 139, 250);
        font-size: 1.125rem;
      }

      .notification-content {
        flex: 1;
        min-width: 0;
      }

      .notification-title {
        font-size: 0.9375rem;
        font-weight: 600;
        color: white;
        margin: 0;
        line-height: 1.3;
      }

      .notification-message {
        font-size: 0.8125rem;
        color: rgba(255, 255, 255, 0.5);
        margin: 0.25rem 0 0;
        line-height: 1.4;
      }

      .notification-time {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.3);
        margin-top: 0.375rem;
        display: block;
      }

      .unread-dot {
        flex-shrink: 0;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--neon-cyan, #00f5ff);
        box-shadow: 0 0 8px rgba(6, 182, 212, 0.4);
        margin-top: 0.375rem;
      }
    `,
  ],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  readonly #location = inject(Location);
  readonly #router = inject(Router);
  readonly #notificationService = inject(NotificationDataService);

  notifications = signal<Notification[]>([]);
  hasUnread = signal(false);

  #sub: Subscription | null = null;

  ngOnInit() {
    this.#sub = this.#notificationService.notifications$.subscribe((notifications) => {
      this.notifications.set(notifications);
      this.hasUnread.set(notifications.some((n) => !n.read));
    });
  }

  ngOnDestroy() {
    this.#sub?.unsubscribe();
  }

  async onNotificationClick(notification: Notification) {
    if (!notification.read) {
      await this.#notificationService.markAsRead([notification.id]);
    }
    if (notification.action?.url) {
      this.#router.navigateByUrl(notification.action.url);
    }
  }

  async markAllAsRead() {
    await this.#notificationService.markAllAsRead(this.notifications());
  }

  getIcon(type: string): string {
    switch (type) {
      case NotificationType.BADGE_EARNED:
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 7 12 7s5-3 7.5-3a2.5 2.5 0 0 1 0 5H18"/><path d="M12 7v14"/><path d="M8 21h8"/></svg>';
      case NotificationType.LEVEL_UP:
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/><path d="m18 9-6-6-6 6"/></svg>';
      case NotificationType.ACHIEVEMENT_UNLOCKED:
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
      case NotificationType.STREAK_MILESTONE:
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
      default:
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
    }
  }

  getRelativeTime(isoDate: string): string {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  goBack() {
    this.#location.back();
  }
}
