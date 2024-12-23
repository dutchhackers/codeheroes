import { onRequest } from 'firebase-functions/v2/https';

import { defaultApi } from './app';

export const api = onRequest(defaultApi);
