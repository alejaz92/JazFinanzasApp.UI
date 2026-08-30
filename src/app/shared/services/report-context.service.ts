import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/** Períodos rápidos de la sección 7 del plan; "custom" usa `from`/`to`. */
export type PeriodPreset = 'this-month' | 'last-month' | 'last-12-months' | 'this-year' | 'last-year' | 'all' | 'custom';

export interface ReportPeriod {
  preset: PeriodPreset;
  /** Solo con preset 'custom', formato yyyy-MM-dd. */
  from?: string;
  to?: string;
}

const DEFAULT_PERIOD: PeriodPreset = 'this-month';

/**
 * Período y moneda de toda la sección de Reportes, elegidos una sola vez
 * en `reports-shell` y persistidos en los query params de la URL — así
 * sobreviven a la recarga y un reporte configurado se puede compartir
 * como enlace (sección 7 del plan). Los reportes hijos leen `period()` y
 * `currencyAssetId()` en vez de manejar su propio filtro de fecha/moneda.
 */
@Injectable({ providedIn: 'root' })
export class ReportContextService {
  private readonly router = inject(Router);

  private readonly periodPreset = signal<PeriodPreset>(DEFAULT_PERIOD);
  private readonly customFrom = signal<string | null>(null);
  private readonly customTo = signal<string | null>(null);
  private readonly currency = signal<number | null>(null);

  readonly period = computed<ReportPeriod>(() => ({
    preset: this.periodPreset(),
    from: this.customFrom() ?? undefined,
    to: this.customTo() ?? undefined,
  }));

  readonly currencyAssetId = this.currency.asReadonly();

  constructor() {
    this.readFromUrl(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.readFromUrl(e.urlAfterRedirects));
  }

  setPeriod(preset: PeriodPreset, range?: { from: string; to: string }): void {
    this.navigate({
      period: preset,
      from: preset === 'custom' ? range?.from ?? null : null,
      to: preset === 'custom' ? range?.to ?? null : null,
    });
  }

  setCurrency(assetId: number): void {
    this.navigate({ currency: assetId });
  }

  private readFromUrl(url: string): void {
    const qp = this.router.parseUrl(url).queryParams;
    this.periodPreset.set(this.isPreset(qp['period']) ? qp['period'] : DEFAULT_PERIOD);
    this.customFrom.set(qp['from'] ?? null);
    this.customTo.set(qp['to'] ?? null);
    this.currency.set(qp['currency'] ? Number(qp['currency']) : null);
  }

  private isPreset(value: unknown): value is PeriodPreset {
    return typeof value === 'string' &&
      ['this-month', 'last-month', 'last-12-months', 'this-year', 'last-year', 'all', 'custom'].includes(value);
  }

  private navigate(queryParams: Record<string, string | number | null>): void {
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
