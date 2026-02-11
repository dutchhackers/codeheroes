import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';

/**
 * HTTP interceptor that adds Firebase Auth ID token to API requests
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  
  // Only add auth token to API requests (relative URLs)
  if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) {
    // Get the current user's ID token
    return from(auth.currentUser?.getIdToken() || Promise.resolve(null)).pipe(
      switchMap((token) => {
        if (token) {
          // Clone the request and add the Authorization header
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
          return next(authReq);
        }
        return next(req);
      })
    );
  }
  
  return next(req);
};
