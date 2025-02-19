import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth } from '@angular/fire/auth';
import { SvgIconComponent } from 'angular-svg-icon';
import { take, tap } from 'rxjs';

import { ActivitiesListComponent, AvatarComponent, LevelBadgeComponent, PageComponent } from '../../components';
import type { IDayActivity } from '../../core/interfaces';
import { FcmService, UserService } from '../../core/services';
import { groupActivitesPerDay, isNotificationsAllowed, isPushNotificationSupported } from '../../core/utils';

@Component({
  templateUrl: './profile.component.html',
  imports: [AvatarComponent, LevelBadgeComponent, PageComponent, ActivitiesListComponent, SvgIconComponent],
})
export class ProfileComponent {
  #auth = inject(Auth);

  #userService = inject(UserService);

  #fcmService = inject(FcmService);

  protected user = toSignal(this.#userService.getMe(), { initialValue: null });

  protected numberOfActivities = 10;

  protected latestActivites = signal<IDayActivity[]>([]);

  protected isPushNotificationSupported = isPushNotificationSupported;

  protected isNotificationsAllowed = isNotificationsAllowed;

  protected error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const user = this.user();
      if (user === null) {
        return;
      }

      this.#userService
        .getUserActivities(user, this.numberOfActivities)
        .pipe(
          take(1),
          tap((activities) => this.latestActivites.set(groupActivitesPerDay(activities))),
        )
        .subscribe();
    });
  }

  public async allowNotifications() {
    // If already allowed, stop
    if (this.isNotificationsAllowed()) {
      return;
    }

    try {
      const token = await this.#fcmService.requestPermission();

      if (!token) {
        alert('Failed to get notification token');
        return;
      }

      await this.#fcmService.saveToken(token);

      alert('Push notifications enabled');
    } catch {
      alert('An error occured saving the notification token');
    }
  }

  public logout() {
    this.#auth.signOut();
  }
}
