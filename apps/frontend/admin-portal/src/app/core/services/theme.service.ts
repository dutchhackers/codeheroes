import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'theme-preference';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(this.#loadIsDark());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('dark-mode', dark);
      }
    });
  }

  toggle(): void {
    const dark = !this.isDark();
    this.isDark.set(dark);
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  }

  #loadIsDark(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'dark';
  }
}
