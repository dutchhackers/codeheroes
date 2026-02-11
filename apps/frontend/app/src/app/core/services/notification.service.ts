import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  collection,
  collectionData,
  Firestore,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import { Observable, of, switchMap, map, catchError, BehaviorSubject } from 'rxjs';
import { Notification } from '@codeheroes/types';
import { UserStatsService } from './user-stats.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  readonly #firestore = inject(Firestore);
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #userStatsService = inject(UserStatsService);

  // Track unread notification count
  readonly #unreadCount$ = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this.#unreadCount$.asObservable();

  /**
   * Get real-time notifications for the current user from Firestore
   */
  getCurrentUserNotifications(): Observable<Notification[]> {
    return this.#userStatsService.getCurrentUserDoc().pipe(
      switchMap((userDoc) => {
        if (!userDoc) {
          return of([]);
        }
        return this.getUserNotifications(userDoc.id);
      }),
    );
  }

  /**
   * Get real-time notifications for a specific user from Firestore
   */
  getUserNotifications(userId: string): Observable<Notification[]> {
    const notificationsRef = collection(this.#firestore, `users/${userId}/notifications`);
    const notificationsQuery = query(
      notificationsRef,
      orderBy('createdAt', 'desc')
    );

    return runInInjectionContext(this.#injector, () =>
      collectionData(notificationsQuery, { idField: 'id' })
    ).pipe(
      map((notifications) => {
        const typedNotifications = notifications as Notification[];
        // Update unread count
        const unreadCount = typedNotifications.filter(n => !n.read).length;
        this.#unreadCount$.next(unreadCount);
        return typedNotifications;
      }),
      catchError((error) => {
        console.error('Error fetching notifications:', error);
        return of([]);
      }),
    );
  }

  /**
   * Get only unread notifications for the current user from Firestore
   */
  getCurrentUserUnreadNotifications(): Observable<Notification[]> {
    return this.#userStatsService.getCurrentUserDoc().pipe(
      switchMap((userDoc) => {
        if (!userDoc) {
          return of([]);
        }
        return this.getUserUnreadNotifications(userDoc.id);
      }),
    );
  }

  /**
   * Get only unread notifications for a specific user from Firestore
   */
  getUserUnreadNotifications(userId: string): Observable<Notification[]> {
    const notificationsRef = collection(this.#firestore, `users/${userId}/notifications`);
    const notificationsQuery = query(
      notificationsRef,
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    return runInInjectionContext(this.#injector, () =>
      collectionData(notificationsQuery, { idField: 'id' })
    ).pipe(
      map((notifications) => {
        const typedNotifications = notifications as Notification[];
        this.#unreadCount$.next(typedNotifications.length);
        return typedNotifications;
      }),
      catchError((error) => {
        console.error('Error fetching unread notifications:', error);
        return of([]);
      }),
    );
  }

  /**
   * Mark notifications as read via API
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;

    try {
      await this.#http
        .put<{ success: boolean }>('/notifications/read', {
          notificationIds,
        })
        .toPromise();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark a single notification as read
   */
  async markOneAsRead(notificationId: string): Promise<void> {
    return this.markAsRead([notificationId]);
  }

  /**
   * Get the current unread count value (synchronous)
   */
  getUnreadCount(): number {
    return this.#unreadCount$.value;
  }
}
