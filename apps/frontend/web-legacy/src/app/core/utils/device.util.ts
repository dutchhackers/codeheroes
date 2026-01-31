// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export const USER_AGENT: string = navigator.userAgent || navigator.vendor || window['opera'];

export function isAndroid(): boolean {
  return /android/i.test(USER_AGENT);
}

export function isIOS(): boolean {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return /iPad|iPhone|iPod/.test(USER_AGENT) && !window['MSStream'];
}

export function vibrate(duration: number | number[] = 100): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
}

export function runningInStandaloneMode(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

export function isPushNotificationSupported() {
  let supported = true;

  if (isIOS() && !window.matchMedia('(display-mode: standalone)').matches) {
    // PWA not installed
    supported = false;
  }

  if (!('serviceWorker' in navigator)) {
    // Service workers are not supported
    supported = false;
  }

  if (!('PushManager' in window)) {
    // Push API is not supported
    supported = false;
  }

  if (!('Notification' in window)) {
    // Notification API is not supported
    supported = false;
  }

  return supported;
}

export function isNotificationsAllowed() {
  return isPushNotificationSupported() && Notification.permission === 'granted';
}
