import { SendResult } from './sender';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export interface EventInfo {
  eventType: string;
  details: Record<string, string | number>;
}

export function printHeader(): void {
  console.log(`\n${COLORS.bright}Azure DevOps Event Simulator${COLORS.reset}`);
  console.log('━'.repeat(40));
}

export function printEventInfo(info: EventInfo): void {
  console.log(`\n${COLORS.cyan}Event:${COLORS.reset}       ${info.eventType}`);

  for (const [key, value] of Object.entries(info.details)) {
    const label = key.charAt(0).toUpperCase() + key.slice(1) + ':';
    console.log(`${COLORS.cyan}${label.padEnd(13)}${COLORS.reset}${value}`);
  }
}

export function printSending(url: string, notificationId: string): void {
  console.log(`\n${COLORS.dim}Notification ID: ${notificationId}${COLORS.reset}`);
  console.log(`${COLORS.dim}Sending to ${url}...${COLORS.reset}`);
}

export function printResult(result: SendResult, verbose: boolean): void {
  if (result.success) {
    console.log(`\n${COLORS.green}✓ Event sent successfully${COLORS.reset}`);
  } else {
    console.log(`\n${COLORS.red}✗ Event failed (HTTP ${result.statusCode})${COLORS.reset}`);
  }

  if (verbose || !result.success) {
    try {
      const parsed = JSON.parse(result.body);
      console.log(`\n${COLORS.gray}Response:${COLORS.reset}`);
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      if (result.body) {
        console.log(`\n${COLORS.gray}Response: ${result.body}${COLORS.reset}`);
      }
    }
  }
}

export function printError(message: string): void {
  console.error(`\n${COLORS.red}Error: ${message}${COLORS.reset}`);
}

export function printWarning(message: string): void {
  console.log(`\n${COLORS.yellow}Warning: ${message}${COLORS.reset}`);
}
