import { Environment } from './environment.interface';

export const environment: Environment = {
  name: 'production',
  useEmulators: false,
  apiUrl: 'https://europe-west1-codeheroes-test.cloudfunctions.net/api',
  firebase: {
    apiKey: 'AIzaSyD5itLlGIFn652bgBi6HOveUuS_4qxnWdE',
    authDomain: 'codeheroes-app-test.firebaseapp.com',
    projectId: '${FIREBASE_PROD_PROJECT_ID}',
    storageBucket: 'codeheroes-app-test.firebasestorage.app',
    messagingSenderId: '498108811341',
    appId: '1:498108811341:web:77206cd509d82ba8243404',
  },
};
