import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'activity',
    pathMatch: 'full',
  },
  {
    path: 'activity',
    loadComponent: () =>
      import('./pages/activity-wall/activity-wall.component').then(
        (m) => m.ActivityWallComponent
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'activity',
  },
];
