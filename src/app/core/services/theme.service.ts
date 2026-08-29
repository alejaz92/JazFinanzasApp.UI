import { Injectable } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';
  private current: Theme = 'light';

  init(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    const preferred: Theme =
      saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.apply(preferred);
  }

  toggle(): void {
    this.apply(this.current === 'light' ? 'dark' : 'light');
  }

  get isDark(): boolean {
    return this.current === 'dark';
  }

  private apply(theme: Theme): void {
    this.current = theme;
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  }
}
