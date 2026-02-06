import * as http from 'http';
import * as crypto from 'crypto';

const WEBHOOK_HOST = 'localhost';
const WEBHOOK_PORT = 5001;
const WEBHOOK_PATH = '/codeheroes-test/europe-west1/azureReceiver';

export interface SendResult {
  success: boolean;
  statusCode: number;
  body: string;
  notificationId: string;
}

export function generateNotificationId(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomPart = crypto.randomBytes(4).toString('hex');
  return `simulate-${timestamp}-${randomPart}`;
}

export async function sendWebhook(payload: object): Promise<SendResult> {
  const body = JSON.stringify(payload);
  const notificationId = (payload as any).id || generateNotificationId();

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: WEBHOOK_HOST,
        port: WEBHOOK_PORT,
        path: WEBHOOK_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'Azure-DevOps-ServiceHooks/simulate',
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          resolve({
            success: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode || 0,
            body: responseBody,
            notificationId,
          });
        });
      }
    );

    req.on('error', (error) => {
      reject(new Error(`Failed to send webhook: ${error.message}`));
    });

    req.write(body);
    req.end();
  });
}

export function getWebhookUrl(): string {
  return `http://${WEBHOOK_HOST}:${WEBHOOK_PORT}${WEBHOOK_PATH}`;
}
