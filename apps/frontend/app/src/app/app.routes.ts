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
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects.component').then((m) => m.ProjectsComponent),
  },
  {
    path: '**',
    redirectTo: 'hq',
  },
];
