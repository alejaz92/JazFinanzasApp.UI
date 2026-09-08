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

export type DashboardPendingKind = 'CardDue' | 'PendingReimbursement' | 'OpenSharedEvent' | 'TripWithoutRecentExpense';

export interface DashboardPendingItem {
    kind: DashboardPendingKind;
    title: string;
    detail: string | null;
    amount: number | null;
    assetSymbol: string | null;
    date: string | null;
    linkId: number | null;
}

export interface Dashboard {
    indicators: DashboardIndicators;
    thermometer: DashboardThermometer;
    pending: DashboardPendingItem[];
}
