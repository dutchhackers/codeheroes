import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { take, tap } from 'rxjs';

import { ActivitiesListComponent, AvatarComponent, LevelBadgeComponent, PageComponent } from '../../components';
import type { IDayActivity } from '../../core/interfaces';
import { UserService } from '../../core/services';
import { groupActivitesPerDay } from '../../core/utils';

@Component({
  templateUrl: './profile.component.html',
  imports: [AvatarComponent, LevelBadgeComponent, PageComponent, ActivitiesListComponent],
})
export class ProfileComponent {
  #userService = inject(UserService);

  protected user = toSignal(this.#userService.getMe(), { initialValue: null });

  protected numberOfActivities = 10;

  protected latestActivites = signal<IDayActivity[]>([]);

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
}
