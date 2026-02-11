import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * HTTP interceptor that prepends the API base URL to relative API requests
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Only prepend base URL if the request URL is relative (doesn't start with http:// or https://)
  if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) {
    const apiUrl = environment.apiUrl || '';
    const apiRequest = req.clone({
      url: `${apiUrl}${req.url}`,
    });
    return next(apiRequest);
  }
  
  return next(req);
};
