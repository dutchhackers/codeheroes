import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

import { UserXpProgressBarComponent } from '../components';
import { FcmService, UserService } from '../core/services';
import { isNotificationsAllowed } from '../core/utils';

@Component({
  template: `<app-user-xp-progress-bar [user]="user()"></app-user-xp-progress-bar> <router-outlet></router-outlet>`,
  imports: [RouterOutlet, UserXpProgressBarComponent],
})
export class MainLayoutComponent implements OnInit {
  #fcmService = inject(FcmService);

  protected user = toSignal(inject(UserService).getMe(), { initialValue: null });

  public async ngOnInit() {
    if (isNotificationsAllowed()) {
      const token = await this.#fcmService.requestPermission();
      this.#fcmService.saveToken(token);
    }
  }
}
