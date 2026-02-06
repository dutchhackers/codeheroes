import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'admin-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-slate-50">
      <header class="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-semibold text-slate-900">Code Heroes</h1>
            <span class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Admin</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm text-slate-600">{{ auth.currentUser()?.email }}</span>
            <button
              type="button"
              (click)="onSignOut()"
              class="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ShellComponent {
  readonly auth = inject(AuthService);

  async onSignOut(): Promise<void> {
    await this.auth.signOut();
    window.location.href = '/login';
  }
}
