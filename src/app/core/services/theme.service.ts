import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';
  private readonly currentSignal = signal<Theme>('light');

  // Señal de solo lectura para consumidores que necesitan reaccionar al cambio de
  // tema (ej. ChartComponent, que reinicializa ECharts porque su tema se fija en
  // el init y no se puede mutar en caliente).
  readonly theme = this.currentSignal.asReadonly();

  init(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    const preferred: Theme =
      saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.apply(preferred);
  }

  toggle(): void {
    this.apply(this.currentSignal() === 'light' ? 'dark' : 'light');
  }

  get isDark(): boolean {
    return this.currentSignal() === 'dark';
  }

  private apply(theme: Theme): void {
    this.currentSignal.set(theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  }
}
