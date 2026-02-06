import { Environment } from './environment.interface';

export const environment: Environment = {
  name: 'test',
  useEmulators: false,
  apiUrl: 'https://europe-west1-codeheroes-test.cloudfunctions.net/api',
  firebase: {
    apiKey: 'AIzaSyAivW24kx9tKnO8yxjEv51bKF2fPHipjlw',
    authDomain: 'codeheroes-test.firebaseapp.com',
    projectId: 'codeheroes-test',
    storageBucket: 'codeheroes-test.firebasestorage.app',
    messagingSenderId: '86706780914',
    appId: '1:86706780914:web:5593d73c71b2f4083c2e6b',
  },
};
