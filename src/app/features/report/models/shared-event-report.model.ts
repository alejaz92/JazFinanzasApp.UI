import { SharedEventConsolidatedDebt, SharedEventCategoryTotal, SharedEventMovement, SharedEventPayment } from '../../shared-events/models/shared-event.model';

// Flujo 7 — Compartidos (Fase 21/22 del plan de rediseño de Reportes). Espejo de los DTOs de
// `SharedEventReportController` (`api/sharedeventreport`). Sin `assetId`: a diferencia de toda otra
// categoría de Reportes, acá no hay una sola moneda de referencia por diseño — cada saldo nace en
// su propia moneda (mismo criterio que "Saldo compartido" en Inicio) y mezclarlas mentiría.
// "Por evento" no tiene modelo propio: reusa `SharedEventDetail` (`shared-event.model.ts`) tal cual,
// consumido con `SharedEventService.getById` — ver el comentario en TripReportService (Fase 21).

export interface SharedEventBalancePoint {
  month: string;
  assetId: number;
  assetSymbol: string;
  myBalance: number;
}

export interface SharedEventAssetAmount {
  assetId: number;
  assetName: string;
  assetSymbol: string;
  total: number;
}

export interface SharedEventRanking {
  eventId: number;
  eventName: string;
  isClosed: boolean;
  amounts: SharedEventAssetAmount[];
}

export interface SharedEventGeneralReport {
  balances: SharedEventConsolidatedDebt[];
  // Subconjunto de "Saldo compartido" (Inicio): solo Eventos, sin el pool de gastos compartidos
  // sueltos (ver comentario del backend, SharedEventReportService) — puede no coincidir con la
  // suma de `balances` a propósito.
  balanceEvolution: SharedEventBalancePoint[];
  eventRanking: SharedEventRanking[];
}

export interface SharedEventPersonMovement {
  eventId: number;
  eventName: string;
  movement: SharedEventMovement;
}

export interface SharedEventPersonPayment {
  eventId: number;
  eventName: string;
  payment: SharedEventPayment;
}

export interface SharedEventPersonReport {
  personId: number;
  personName: string;
  balances: SharedEventConsolidatedDebt[];
  balanceEvolution: SharedEventBalancePoint[];
  categoryTotals: SharedEventCategoryTotal[];
  movements: SharedEventPersonMovement[];
  payments: SharedEventPersonPayment[];
}
