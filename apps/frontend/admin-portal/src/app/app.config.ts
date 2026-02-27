import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { getAnalytics, provideAnalytics, ScreenTrackingService } from '@angular/fire/analytics';

import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

let authEmulatorConnected = false;

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      const auth = getAuth();
      if (environment.useEmulators && !authEmulatorConnected) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        authEmulatorConnected = true;
      }
      return auth;
    }),
    ...(environment.firebase.measurementId
      ? [provideAnalytics(() => getAnalytics()), ScreenTrackingService]
      : []),
  ],
};
