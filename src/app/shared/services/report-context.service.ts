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

  // Corrección 2026-09-10: mismo criterio que cardId — el selector de Cartera (Carteras — Detalle)
  // y de Crypto (Cryptos — Detalle) vivían sueltos dentro de cada pantalla en vez de en la barra de
  // filtros compartida, así que quedaban visualmente fuera de esa barra.
  private readonly portfolioId = signal<number | null>(null);
  private readonly cryptoAssetId = signal<number | null>(null);

  // Corrección 2026-09-10: switch de Carteras — General/Detalle para incluir o no el efectivo en
  // cuentas — mismo criterio que includeRecurring (vive en la barra de filtros y en la URL).
  private readonly includeCashFlag = signal<boolean>(true);

  // Revisión de Bolsa (2026-09-12, D-11/D-14/D-15): mismo criterio que cardId/portfolioId/
  // cryptoAssetId — filtro de tipo de activo (null = "Todos", D-11), ticker elegido para Bolsa —
  // Detalle, e interruptor de posiciones cerradas (D-14), los tres en la barra de la sección y en
  // la URL, no sueltos dentro de cada pantalla.
  private readonly stockTypeId = signal<number | null>(null);
  private readonly stockAssetId = signal<number | null>(null);
  private readonly includeClosedFlag = signal<boolean>(false);

  // Fase 22 (Viajes y Compartidos, Flujo 6/7): mismo criterio que portfolioId/cryptoAssetId —
  // selector de viaje (Viajes — Detalle), de persona (Compartidos — Por persona) y de evento
  // (Compartidos — Por evento), los tres en la barra de filtros compartida y en la URL.
  private readonly tripId = signal<number | null>(null);
  private readonly personId = signal<number | null>(null);
  private readonly eventId = signal<number | null>(null);

  readonly period = computed<ReportPeriod>(() => ({
    preset: this.periodPreset(),
    from: this.customFrom() ?? undefined,
    to: this.customTo() ?? undefined,
  }));

  readonly currencyAssetId = this.currency.asReadonly();
  readonly selectedCardId = this.cardId.asReadonly();
  readonly includeRecurringExpenses = this.includeRecurring.asReadonly();
  readonly selectedPortfolioId = this.portfolioId.asReadonly();
  readonly selectedCryptoAssetId = this.cryptoAssetId.asReadonly();
  readonly includeCash = this.includeCashFlag.asReadonly();
  readonly selectedStockTypeId = this.stockTypeId.asReadonly();
  readonly selectedStockAssetId = this.stockAssetId.asReadonly();
  readonly includeClosedPositions = this.includeClosedFlag.asReadonly();
  readonly selectedTripId = this.tripId.asReadonly();
  readonly selectedPersonId = this.personId.asReadonly();
  readonly selectedEventId = this.eventId.asReadonly();

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

  setPortfolioId(portfolioId: number): void {
    this.navigate({ portfolioId });
  }

  setCryptoAssetId(cryptoAssetId: number): void {
    this.navigate({ cryptoAssetId });
  }

  setIncludeCash(value: boolean): void {
    // Se omite de la URL en su valor default (true) para no ensuciar el enlace en el caso común.
    this.navigate({ includeCash: value ? null : 'false' });
  }

  setStockTypeId(stockTypeId: number): void {
    // 0 ("Todos", D-11) se omite de la URL — es el default, igual que includeCash/includeRecurring.
    this.navigate({ stockTypeId: stockTypeId === 0 ? null : stockTypeId });
  }

  setStockAssetId(stockAssetId: number): void {
    this.navigate({ stockAssetId });
  }

  setIncludeClosedPositions(value: boolean): void {
    // Se omite de la URL en su valor default (false, D-14) para no ensuciar el enlace en el caso común.
    this.navigate({ includeClosed: value ? 'true' : null });
  }

  setTripId(tripId: number): void {
    this.navigate({ tripId });
  }

  setPersonId(personId: number): void {
    this.navigate({ personId });
  }

  setEventId(eventId: number): void {
    this.navigate({ eventId });
  }

  private readFromUrl(url: string): void {
    const qp = this.router.parseUrl(url).queryParams;
    this.periodPreset.set(this.isPreset(qp['period']) ? qp['period'] : DEFAULT_PERIOD);
    this.customFrom.set(qp['from'] ?? null);
    this.customTo.set(qp['to'] ?? null);
    this.currency.set(qp['currency'] ? Number(qp['currency']) : null);
    this.cardId.set(qp['cardId'] != null ? Number(qp['cardId']) : null);
    this.includeRecurring.set(qp['includeRecurring'] !== 'false');
    this.portfolioId.set(qp['portfolioId'] != null ? Number(qp['portfolioId']) : null);
    this.cryptoAssetId.set(qp['cryptoAssetId'] != null ? Number(qp['cryptoAssetId']) : null);
    this.includeCashFlag.set(qp['includeCash'] !== 'false');
    this.stockTypeId.set(qp['stockTypeId'] != null ? Number(qp['stockTypeId']) : null);
    this.stockAssetId.set(qp['stockAssetId'] != null ? Number(qp['stockAssetId']) : null);
    this.includeClosedFlag.set(qp['includeClosed'] === 'true');
    this.tripId.set(qp['tripId'] != null ? Number(qp['tripId']) : null);
    this.personId.set(qp['personId'] != null ? Number(qp['personId']) : null);
    this.eventId.set(qp['eventId'] != null ? Number(qp['eventId']) : null);
  }

  private isPreset(value: unknown): value is PeriodPreset {
    return typeof value === 'string' &&
      ['this-month', 'last-month', 'last-12-months', 'this-year', 'last-year', 'all', 'custom'].includes(value);
  }

  private navigate(queryParams: Record<string, string | number | null>): void {
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
