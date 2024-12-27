import { setGlobalOptions } from 'firebase-functions/v2/options';
import { onRequest } from 'firebase-functions/v2/https';
import { DEFAULT_REGION } from '@codeheroes/common';

import { initializeApp } from 'firebase-admin/app';
initializeApp();

import { GitHubReceiverLegacyApp } from './github-receiver-legacy-app';
import { GitHubReceiverApp } from './github-receiver-app';

setGlobalOptions({ region: DEFAULT_REGION });

export const gitHubReceiver = onRequest(GitHubReceiverLegacyApp);

export const gitHubReceiver2 = onRequest(GitHubReceiverApp);
