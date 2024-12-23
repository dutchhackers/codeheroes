import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';

const DEFAULT_REGION = 'europe-west1';

// import { connectFirestore } from '@codeheroes/common';
// connectFirestore();

import { defaultApi } from './app';

setGlobalOptions({ region: DEFAULT_REGION });

/**
 * HTTP trigger
 * */
export const api = onRequest(
  { memory: '2GiB', timeoutSeconds: 120 },
  defaultApi
);
