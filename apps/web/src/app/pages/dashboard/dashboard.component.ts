import { Component, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';

@Component({
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  protected readonly auth = inject(Auth);
}
