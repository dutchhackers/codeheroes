import { Component, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router, RouterModule } from '@angular/router';
import { ROUTES } from './core/const';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  #auth = inject(Auth);
  #router = inject(Router);

  constructor() {
    this.#auth.onAuthStateChanged((user) => {
      if (user === null) {
        this.#router.navigate([ROUTES.LOGIN]);
        return;
      }

      this.#router.navigate([ROUTES.DASHBOARD]);
    });
  }
}
