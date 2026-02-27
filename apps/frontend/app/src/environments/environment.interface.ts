/**
 * Shared Environment interface for type safety across all environment configurations.
 */
export interface Environment {
  name: 'local' | 'test' | 'production';
  useEmulators: boolean;
  apiUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  appVersion: string;
  vapidKey?: string;
  autoLogin?: {
    email: string;
    password: string;
  };
}
