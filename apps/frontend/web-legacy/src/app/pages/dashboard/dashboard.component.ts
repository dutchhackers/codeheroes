import { Component, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';

@Component({
  template: `
    <div class="w-96 mx-auto my-8 p-4 border-2 border-slate-300 rounded-lg">
      <h1 class="mb-4">Dashboard</h1>
      <p class="mb-4">Welcome to your dashboard {{ auth.currentUser?.displayName }}</p>
      <button (click)="auth.signOut()">Sign out</button>
    </div>
  `,
})
export class DashboardComponent {
  protected readonly auth = inject(Auth);
}
