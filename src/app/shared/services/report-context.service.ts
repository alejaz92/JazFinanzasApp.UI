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

  // Corrección 2026-09-05: filtros propios de Tarjetas (Por tarjeta / Compromiso futuro), en la
  // misma barra y con el mismo criterio de "vive en la URL, se puede compartir como enlace" que
  // período y moneda (T12) — antes cada reporte los mostraba dentro del cuerpo, inconsistente con
  // el resto de la sección. selectedCardId en null significa "todavía no se eligió/no aplica";
  // 0 en la URL significa "Todas las tarjetas" (Compromiso futuro lo admite, Por tarjeta no).
  private readonly cardId = signal<number | null>(null);
  private readonly includeRecurring = signal<boolean>(true);

  readonly period = computed<ReportPeriod>(() => ({
    preset: this.periodPreset(),
    from: this.customFrom() ?? undefined,
    to: this.customTo() ?? undefined,
  }));

  readonly currencyAssetId = this.currency.asReadonly();
  readonly selectedCardId = this.cardId.asReadonly();
  readonly includeRecurringExpenses = this.includeRecurring.asReadonly();

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

  setCardId(cardId: number): void {
    this.navigate({ cardId });
  }

  setIncludeRecurring(value: boolean): void {
    // Se omite de la URL en su valor default (true) para no ensuciar el enlace en el caso común.
    this.navigate({ includeRecurring: value ? null : 'false' });
  }

  private readFromUrl(url: string): void {
    const qp = this.router.parseUrl(url).queryParams;
    this.periodPreset.set(this.isPreset(qp['period']) ? qp['period'] : DEFAULT_PERIOD);
    this.customFrom.set(qp['from'] ?? null);
    this.customTo.set(qp['to'] ?? null);
    this.currency.set(qp['currency'] ? Number(qp['currency']) : null);
    this.cardId.set(qp['cardId'] != null ? Number(qp['cardId']) : null);
    this.includeRecurring.set(qp['includeRecurring'] !== 'false');
  }

  private isPreset(value: unknown): value is PeriodPreset {
    return typeof value === 'string' &&
      ['this-month', 'last-month', 'last-12-months', 'this-year', 'last-year', 'all', 'custom'].includes(value);
  }

  private navigate(queryParams: Record<string, string | number | null>): void {
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
