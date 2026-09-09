export interface DashboardSharedBalance {
    assetId: number;
    assetSymbol: string;
    net: number;
}

export interface DashboardIndicators {
    referenceAssetSymbol: string;
    available: number;
    netWorthGross: number;
    netWorthNet: number;
    netWorthChangeVsPreviousMonth: number;
    monthResult: number;
    monthResultPreviousMonth: number;
    // Siempre en pesos, no en referenceAssetSymbol — mismo criterio que la tabla de Tarjetas → General.
    cardsDueAmountInPesos: number;
    cardsNextDueDate: string | null;
    sharedBalances: DashboardSharedBalance[];
}

export interface DashboardThermometer {
    monthToDateAmount: number;
    previousMonthSameDayAmount: number;
    projectedMonthEndAmount: number;
    daysElapsed: number;
    daysInMonth: number;
}

// Corrección 2026-09-08: se sacó 'PendingReimbursement' — un reintegro ya acreditado (lo único que
// ese ítem mostraba) es plata que ya es del usuario, sin nada pendiente de su parte; el usuario pidió
// acotar la bandeja a tarjetas por vencer y deudas/saldos que lo involucran directamente.
//
// Corrección 2026-09-08 (segunda vuelta): se sumó 'PersonDebt' — deudas de gastos sueltos
// (SharedExpense V1, sin Evento) que antes no entraban a la bandeja pese a ser "deuda relacionada
// conmigo" (lo que el usuario pidió en la ronda anterior).
export type DashboardPendingKind = 'CardDue' | 'OpenSharedEvent' | 'PersonDebt' | 'TripWithoutRecentExpense';
export type DashboardPendingSeverity = 'info' | 'warning' | 'danger';

export interface DashboardPendingItem {
    kind: DashboardPendingKind;
    title: string;
    detail: string | null;
    amount: number | null;
    assetSymbol: string | null;
    date: string | null;
    linkId: number | null;
    severity: DashboardPendingSeverity;
}

export interface Dashboard {
    indicators: DashboardIndicators;
    thermometer: DashboardThermometer;
    pending: DashboardPendingItem[];
}
