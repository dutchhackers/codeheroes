import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme-preference';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themePreference = signal<ThemePreference>(this.#loadPreference());

  readonly #systemDark = signal(
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  readonly effectiveTheme = computed<'light' | 'dark'>(() => {
    const pref = this.themePreference();
    if (pref === 'system') {
      return this.#systemDark() ? 'dark' : 'light';
    }
    return pref;
  });

  constructor() {
    // Listen to OS preference changes
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (e) => this.#systemDark.set(e.matches));
    }

    // Apply theme class whenever effectiveTheme changes
    effect(() => {
      const theme = this.effectiveTheme();
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('dark-mode', theme === 'dark');
      }
    });
  }

  setPreference(pref: ThemePreference): void {
    this.themePreference.set(pref);
    localStorage.setItem(STORAGE_KEY, pref);
  }

  #loadPreference(): ThemePreference {
    if (typeof localStorage === 'undefined') return 'system';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'system';
  }
}
