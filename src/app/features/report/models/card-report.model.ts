import { CardTransactionPaymentList } from '../../cardTransactions/models/CardTransactionPayment-List.model';

// Corrección 2026-09-05: los 4 reportes de Tarjetas devuelven estos 5 campos — de qué moneda de
// referencia se trata y los colores por moneda de origen (mismo criterio que NetWorthTotal.color
// en Patrimonio → General), para no repetirlos sueltos en cada interfaz.
export interface CardCurrencyMeta {
    referenceAssetSymbol: string;
    pesoAssetSymbol: string;
    pesoAssetColor: string;
    dollarAssetSymbol: string;
    dollarAssetColor: string;
}

export interface CardMonthAmount {
    cardId: number;
    cardName: string;
    pesosAmount: number;
    dollarsAmount: number;
}

export interface CardMonthlySeriesPoint {
    month: string;
    cards: CardMonthAmount[];
}

export interface CardGeneralReport extends CardCurrencyMeta {
    monthlySeries: CardMonthlySeriesPoint[];
    currentMonthSummary: CardTransactionPaymentList[];
}

export interface CardCategoryAmount {
    transactionClassId: number;
    transactionClassName: string;
    pesosAmount: number;
    dollarsAmount: number;
}

export interface CardSimpleMonthlyPoint {
    month: string;
    pesosAmount: number;
    dollarsAmount: number;
}

export interface CardDetailReport extends CardCurrencyMeta {
    cardId: number;
    cardName: string;
    nextClosingDate: string | null;
    nextDueDate: string | null;
    currentMonthPesos: number;
    currentMonthDollars: number;
    byCategory: CardCategoryAmount[];
    monthlyEvolution: CardSimpleMonthlyPoint[];
}

export interface FutureCommitmentPurchaseAmount {
    cardTransactionId: number;
    detail: string;
    cardName: string;
    assetName: string;
    transactionClassId: number;
    transactionClassName: string;
    amount: number;
}

export interface FutureCommitmentMonth {
    month: string;
    purchases: FutureCommitmentPurchaseAmount[];
}

export interface FutureCommitmentPurchase {
    cardTransactionId: number;
    detail: string;
    cardName: string;
    assetName: string;
    installmentAmount: number;
    startMonth: string;
    endMonth: string;
    remainingInstallments: number;
}

export interface CardFutureCommitment extends CardCurrencyMeta {
    monthlySeries: FutureCommitmentMonth[];
    timeline: FutureCommitmentPurchase[];
}

export interface PromotionMonth {
    month: string;
    pesosAmount: number;
    dollarsAmount: number;
}

export interface PendingReimbursement {
    discountId: number;
    cardTransactionId: number;
    detail: string;
    cardName: string;
    assetName: string;
    pendingToCredit: number;
    pendingToApply: number;
    creditDate: string;
}

export interface CardPromotionsReport extends CardCurrencyMeta {
    totalSavedPesos: number;
    totalSavedDollars: number;
    percentOfConsumptionPesos: number | null;
    percentOfConsumptionDollars: number | null;
    monthlySeries: PromotionMonth[];
    pending: PendingReimbursement[];
}
