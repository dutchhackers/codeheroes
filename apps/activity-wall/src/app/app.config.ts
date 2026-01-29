import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { connectFirestoreEmulator, getFirestore, provideFirestore } from '@angular/fire/firestore';

import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

// Track emulator connections to prevent multiple calls
let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      const auth = getAuth();
      if (environment.useEmulators && !authEmulatorConnected) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        authEmulatorConnected = true;
      }
      return auth;
    }),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators && !firestoreEmulatorConnected) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
        firestoreEmulatorConnected = true;
      }
      return firestore;
    }),
  ],
};
