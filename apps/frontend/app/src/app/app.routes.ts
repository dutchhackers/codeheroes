import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'hq',
    pathMatch: 'full',
  },
  {
    path: 'hq',
    loadComponent: () => import('./pages/hq/hq.component').then((m) => m.HqComponent),
  },
  {
    path: 'activity',
    loadComponent: () => import('./pages/activity-wall/activity-wall.component').then((m) => m.ActivityWallComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/user-search/user-search.component').then((m) => m.UserSearchComponent),
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./pages/user-profile/user-profile.component').then((m) => m.UserProfileComponent),
  },
  {
    path: '**',
    redirectTo: 'hq',
  },
];
