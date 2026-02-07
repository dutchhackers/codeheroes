import { setGlobalOptions } from 'firebase-functions/v2/options';
import { onRequest } from 'firebase-functions/v2/https';
import { DEFAULT_REGION } from '@codeheroes/common';
import { initializeApp } from 'firebase-admin/app';
import { processBitbucketServerWebhook } from './webhook-handler';

initializeApp();
setGlobalOptions({ region: DEFAULT_REGION, memory: '2GiB' });

export const bitbucketServerReceiver = onRequest(processBitbucketServerWebhook);
