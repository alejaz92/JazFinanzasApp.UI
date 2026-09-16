import { SharedEventConsolidatedDebt, SharedEventCategoryTotal, SharedEventMovement, SharedEventPayment } from '../../shared-events/models/shared-event.model';

// Flujo 7 — Compartidos (Fase 21/22 del plan de rediseño de Reportes). Espejo de los DTOs de
// `SharedEventReportController` (`api/sharedeventreport`). Sin `assetId`: a diferencia de toda otra
// categoría de Reportes, acá no hay una sola moneda de referencia por diseño — cada saldo nace en
// su propia moneda (mismo criterio que "Saldo compartido" en Inicio) y mezclarlas mentiría.
// "Por evento" no tiene modelo propio: reusa `SharedEventDetail` (`shared-event.model.ts`) tal cual,
// consumido con `SharedEventService.getById` — ver el comentario en TripReportService (Fase 21).
//
// Hubo un `SharedEventBalancePoint`/`balanceEvolution` (evolución mensual del saldo) sacado tras la
// revisión de la Fase 22 — solo se podía reconstruir a partir de Eventos, y la mayoría del saldo real
// viene del pool de gastos compartidos sueltos (sin Evento), que en el 89% de los casos no tiene
// fecha histórica de cuándo se saldó. El gráfico terminaba contradiciendo la tabla de "Saldo actual"
// de la misma pantalla — ver el comentario en `SharedEventReportService` (backend).

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
  categoryTotals: SharedEventCategoryTotal[];
  movements: SharedEventPersonMovement[];
  payments: SharedEventPersonPayment[];
}
