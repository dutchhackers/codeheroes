import { AuthGuard, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import type { Routes } from '@angular/router';
import { ROUTES } from './core/constants';
import { MainLayoutComponent } from './layout/main-layout.component';

export const appRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    data: { authGuardPipe: () => redirectUnauthorizedTo('login') },
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: ROUTES.DASHBOARD,
        loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: ROUTES.PROFILE,
        loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
  {
    path: ROUTES.LOGIN,
    canActivate: [AuthGuard],
    data: { authGuardPipe: () => redirectLoggedInTo('/') },
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
];
