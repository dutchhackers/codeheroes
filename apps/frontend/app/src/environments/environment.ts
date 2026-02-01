import { Environment } from './environment.interface';

export const environment: Environment = {
  name: 'local',
  useEmulators: false,
  apiUrl: '',
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },
};
