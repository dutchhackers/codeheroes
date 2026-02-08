import * as http from 'http';
import * as crypto from 'crypto';

const WEBHOOK_HOST = 'localhost';
const WEBHOOK_PORT = 5001;
const WEBHOOK_PATH = '/codeheroes-test/europe-west1/bitbucketReceiver';

export interface SendResult {
  success: boolean;
  statusCode: number;
  body: string;
  requestUuid: string;
}

export function generateRequestUuid(): string {
  return crypto.randomUUID();
}

export async function sendWebhook(
  eventType: string,
  payload: object,
  requestUuid?: string,
): Promise<SendResult> {
  const id = requestUuid || generateRequestUuid();
  const body = JSON.stringify(payload);

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
          'X-Event-Key': eventType,
          'X-Request-UUID': id,
          'User-Agent': 'Bitbucket-Webhooks/2.0',
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
            requestUuid: id,
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
