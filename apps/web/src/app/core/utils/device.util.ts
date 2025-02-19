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
    console.warn('De PWA is niet geïnstalleerd op het startscherm.');
    supported = false;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers worden niet ondersteund op dit apparaat.');
    supported = false;
  }

  if (!('PushManager' in window)) {
    console.warn('Push API wordt niet ondersteund op dit apparaat.');
    supported = false;
  }

  if (!('Notification' in window)) {
    console.warn('Notification API wordt niet ondersteund op dit apparaat.');
    supported = false;
  }

  return supported;
}

export function isNotificationsAllowed() {
  return isPushNotificationSupported() && Notification.permission === 'granted';
}
