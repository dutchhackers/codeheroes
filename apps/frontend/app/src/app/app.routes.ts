import { Routes } from '@angular/router';

/**
 * Wraps a dynamic import to handle chunk load failures (e.g. stale service worker cache).
 * When a chunk fails to load, the page is reloaded once to fetch the latest assets.
 */
function loadWithReload<T>(importFn: () => Promise<T>): () => Promise<T> {
  return () =>
    importFn().catch((error) => {
      const chunkFailedMessage = /Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module/;
      if (chunkFailedMessage.test(error?.message)) {
        const reloadKey = 'chunk-reload';
        const hasReloaded = sessionStorage.getItem(reloadKey);
        if (!hasReloaded) {
          sessionStorage.setItem(reloadKey, 'true');
          window.location.reload();
          return new Promise<never>(() => {
            // Intentionally left empty — page is about to reload.
          });
        }
        sessionStorage.removeItem(reloadKey);
      }
      throw error;
    });
}

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'hq',
    pathMatch: 'full',
  },
  {
    path: 'hq',
    loadComponent: loadWithReload(() => import('./pages/hq/hq.component').then((m) => m.HqComponent)),
  },
  {
    path: 'projects/:id',
    loadComponent: loadWithReload(() =>
      import('./pages/projects/project-detail.component').then((m) => m.ProjectDetailComponent),
    ),
  },
  {
    path: 'projects',
    loadComponent: loadWithReload(() =>
      import('./pages/projects/projects-list.component').then((m) => m.ProjectsListComponent),
    ),
  },
  {
    path: 'activity',
    loadComponent: loadWithReload(() =>
      import('./pages/activity-wall/activity-wall.component').then((m) => m.ActivityWallComponent),
    ),
  },
  {
    path: 'profile',
    loadComponent: loadWithReload(() =>
      import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
    ),
  },
  {
    path: 'search',
    loadComponent: loadWithReload(() =>
      import('./pages/user-search/user-search.component').then((m) => m.UserSearchComponent),
    ),
  },
  {
    path: 'users/:id',
    loadComponent: loadWithReload(() =>
      import('./pages/user-profile/user-profile.component').then((m) => m.UserProfileComponent),
    ),
  },
  {
    path: '**',
    redirectTo: 'hq',
  },
];
