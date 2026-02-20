import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'projects',
        loadComponent: () => import('./pages/projects/projects.component').then((m) => m.ProjectsComponent),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./pages/projects/project-detail.component').then((m) => m.ProjectDetailComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./pages/users/user-detail.component').then((m) => m.UserDetailComponent),
      },
      {
        path: 'unmatched',
        loadComponent: () =>
          import('./pages/unmatched/unmatched.component').then((m) => m.UnmatchedComponent),
      },
      {
        path: 'leaderboard',
        loadComponent: () =>
          import('./pages/leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
