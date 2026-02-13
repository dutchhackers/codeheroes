import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

const isEmulatorAutoLogin = environment.useEmulators && !!environment.autoLogin;

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (isEmulatorAutoLogin) {
    return true;
  }

  if (authService.isLoading()) {
    return toObservable(authService.isLoading).pipe(
      filter((loading) => !loading),
      take(1),
      map(() => (authService.isAdmin() ? true : router.createUrlTree(['/login']))),
    );
  }

  if (authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
