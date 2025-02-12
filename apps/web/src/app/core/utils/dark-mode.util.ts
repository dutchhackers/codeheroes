import { signal } from '@angular/core';

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  darkModeEnabled.set(event.matches);
});

function darkModeEnabledOnDevice(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const darkModeEnabled = signal(darkModeEnabledOnDevice());
