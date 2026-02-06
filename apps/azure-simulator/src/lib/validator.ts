import * as http from 'http';

const EMULATOR_HOST = 'localhost';
const EMULATOR_PORT = 5001;
const TIMEOUT_MS = 3000;

export interface ValidationResult {
  available: boolean;
  error?: string;
}

export async function checkEmulator(): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: EMULATOR_HOST,
        port: EMULATOR_PORT,
        path: '/',
        method: 'GET',
        timeout: TIMEOUT_MS,
      },
      (res) => {
        resolve({ available: true });
        res.resume();
      }
    );

    req.on('error', () => {
      resolve({
        available: false,
        error: `Firebase emulator not reachable at http://${EMULATOR_HOST}:${EMULATOR_PORT}\n` +
          'Start the emulators with: nx serve firebase-app',
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        available: false,
        error: `Firebase emulator connection timed out at http://${EMULATOR_HOST}:${EMULATOR_PORT}\n` +
          'Start the emulators with: nx serve firebase-app',
      });
    });

    req.end();
  });
}
