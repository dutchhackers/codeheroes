import { Component, computed, input } from '@angular/core';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import type { IUser } from '../../core/interfaces';

@Component({
  selector: 'app-user-xp-progress-bar',
  templateUrl: './user-xp-progress-bar.component.html',
  imports: [ProgressBarComponent],
})
export class UserXpProgressBarComponent {
  protected percentage = computed(() => {
    const user = this.user();
    if (user === null) {
      return 0;
    }

    return (user.xp / user.xpToNextLevel) * 100;
  });

  public user = input.required<IUser | null>();
}
