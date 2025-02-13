import { Component, effect, inject, signal } from '@angular/core';
import { UserService } from '../../core/services';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivityCardComponent, AvatarComponent, LevelBadgeComponent, PageComponent } from '../../components';
import { take, tap } from 'rxjs';
import { groupActivitesPerDay } from '../../core/utils';
import type { DayActivities } from '../../core/types';
import { DatePipe, KeyValuePipe } from '@angular/common';

@Component({
  templateUrl: './profile.component.html',
  imports: [AvatarComponent, LevelBadgeComponent, PageComponent, ActivityCardComponent, KeyValuePipe, DatePipe],
})
export class ProfileComponent {
  #userService = inject(UserService);

  protected user = toSignal(this.#userService.getMe(), { initialValue: null });

  protected latestActivites = signal<DayActivities>({});

  constructor() {
    effect(() => {
      const user = this.user();
      if (user === null) {
        return;
      }

      this.#userService
        .getUserActivities(user, 20)
        .pipe(
          take(1),
          tap((activities) => this.latestActivites.set(groupActivitesPerDay(activities))),
        )
        .subscribe();
    });
  }
}
