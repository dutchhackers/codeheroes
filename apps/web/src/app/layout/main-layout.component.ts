import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

import { UserXpProgressBarComponent } from '../components';
import { UserService } from '../core/services';

@Component({
  template: `<app-user-xp-progress-bar [user]="user()"></app-user-xp-progress-bar> <router-outlet></router-outlet>`,
  imports: [RouterOutlet, UserXpProgressBarComponent],
})
export class MainLayoutComponent {
  protected user = toSignal(inject(UserService).getMe(), { initialValue: null });
}
