import { setGlobalOptions } from 'firebase-functions/v2/options';
import { onRequest } from 'firebase-functions/v2/https';
import { DEFAULT_REGION } from '@codeheroes/common';

import { GitHubReceiverApp } from './app/app';


setGlobalOptions({ region: DEFAULT_REGION });

export const gitHubReceiver = onRequest(GitHubReceiverApp);
