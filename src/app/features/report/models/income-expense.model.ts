export interface WaterfallStep {
    categoryName: string;
    amount: number;
}

export interface IncExpWaterfall {
    month: string;
    totalIncome: number;
    expenseSteps: WaterfallStep[];
    totalExpense: number;
    result: number;
    previousMonthResult: number;
}

export interface IncExpEvolutionPoint {
    month: string;
    income: number;
    expense: number;
    result: number;
    cumulativeResult: number;
    expenseMovingAverage: number | null;
}

export interface CategoryDetail {
    categoryId: number;
    categoryName: string;
    amount: number;
    monthlyTrend: number[];
    rankCurrent: number;
    rankPrevious: number | null;
}

export interface CategoryGroup {
    groupId: number;
    groupName: string;
    amount: number;
    categories: CategoryDetail[];
}

export interface SpendingByCategory {
    month: string;
    groups: CategoryGroup[];
}

export interface MonthlyAmount {
    month: string;
    amount: number;
}

export interface CategoryAmount {
    categoryName: string;
    amount: number;
}

export interface TagSpending {
    tagId: number;
    tagName: string;
    color: string | null;
    totalAmount: number;
    monthlyEvolution: MonthlyAmount[];
    byCategory: CategoryAmount[];
}

export interface DaySpending {
    date: string;
    amount: number;
}

export interface WeekdayAverage {
    dayOfWeek: number;
    average: number;
}

export interface SpendingCalendar {
    year: number;
    days: DaySpending[];
    weekdayAverages: WeekdayAverage[];
    /** Con la medida de compra: los cargos recurrentes de tarjeta de cada mes, que no tienen un día de compra y por eso no están en `days`. Con la de cuentas, vacío. */
    recurringByMonth: MonthlyAmount[];
}

export type SpendingRowKind = 'Direct' | 'CardInstallment' | 'CardRecurring';

/**
 * Una fila del gasto por compra (plan-ingresos-egresos-por-fecha-de-compra.md, D4): lo que compone el número de una categoría, de un día o de una etiqueta.
 * `amount` es lo que cuenta en el gasto, en la moneda elegida; los campos `native*` están en la moneda del movimiento.
 */
export interface SpendingRow {
    date: string;
    kind: SpendingRowKind;
    sourceId: number;
    categoryId: number;
    categoryName: string;
    parentName: string | null;
    detail: string | null;
    amount: number;
    /** Solo una cuota: cuál es, de cuántas, la compra entera (tu parte, en la moneda elegida) y cuándo se hizo. */
    installmentNumber: number | null;
    installments: number | null;
    purchaseOwnTotal: number | null;
    purchaseDate: string | null;
    nativeAssetId: number | null;
    nativeAssetSymbol: string | null;
    nativeAmount: number;
    /** Una compra con tarjeta: su total y lo que pusieron otras personas y el banco. */
    nativeGrossTotal: number | null;
    nativeOthersShare: number | null;
    nativeDiscounts: number | null;
    accountId: number | null;
    accountName: string | null;
    cardId: number | null;
    cardName: string | null;
}

export interface IncomeCategorySeries {
    categoryId: number;
    categoryName: string;
    monthlyTrend: number[];
}

export interface IncomeCategoryAmount {
    categoryId: number;
    categoryName: string;
    amount: number;
}

export interface IncomeComposition {
    month: string;
    categories: IncomeCategoryAmount[];
}

export interface IncomeCategoryDay {
    categoryId: number;
    categoryName: string;
    date: string;
    amount: number;
}
