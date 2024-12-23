import { onRequest } from 'firebase-functions/v2/https';
import { GitHubReceiverApp } from './app/app';

export const gitHubReceiver = onRequest(GitHubReceiverApp);
