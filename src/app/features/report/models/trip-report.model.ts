import { TripStatus, TripType } from '../../trips/models/trip.model';

// Flujo 6 — Viajes (Fase 21/22 del plan de rediseño de Reportes). Espejo de los DTOs de
// `TripReportController` (`api/tripreport`), con `assetId` explícito (T12) en vez de la moneda
// principal resuelta del usuario que usaban los endpoints viejos (`api/report/trips-general`/
// `trip-detail`, que TripService todavía expone para el resto de la app).

export interface TripGeneralReport {
  tripId: number;
  name: string;
  type: TripType;
  startDate: string;
  endDate: string;
  status: TripStatus;
  durationDays: number;
  total: number;
  costPerDay: number;
}

export interface TripReportClassBreakdown {
  transactionClass: string;
  amount: number;
}

export interface TripReportEventNet {
  eventId: number;
  eventName: string;
  amount: number;
}

export interface TripDailySpending {
  date: string;
  amount: number;
}

export interface TripCostPerDayComparison {
  tripId: number;
  name: string;
  costPerDay: number;
  isCurrent: boolean;
}

export interface TripDetailReport {
  tripId: number;
  name: string;
  durationDays: number;
  total: number;
  costPerDay: number;
  breakdown: TripReportClassBreakdown[];
  netBreakdown: TripReportEventNet[];
  dailySpending: TripDailySpending[];
  // Total - Σ dailySpending: un movimiento etiquetado al viaje con fecha fuera de su rango de
  // fechas (pasajes comprados con anticipación, por ejemplo) — ver el comentario del backend
  // (TripReportService, Fase 21). Sigue sumado en `total`, pero no aparece en ningún día del
  // gráfico, así que se muestra aparte para que esa plata no desaparezca en silencio.
  outsideTripRangeAmount: number;
  costPerDayComparison: TripCostPerDayComparison[];
}
