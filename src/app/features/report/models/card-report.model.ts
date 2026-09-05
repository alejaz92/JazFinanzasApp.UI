import { CardTransactionPaymentList } from '../../cardTransactions/models/CardTransactionPayment-List.model';

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

export interface CardGeneralReport {
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

export interface CardDetailReport {
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

export interface CardFutureCommitment {
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
    pendingToCredit: number;
    pendingToApply: number;
    creditDate: string;
}

export interface CardPromotionsReport {
    totalSavedPesos: number;
    totalSavedDollars: number;
    percentOfConsumptionPesos: number | null;
    percentOfConsumptionDollars: number | null;
    monthlySeries: PromotionMonth[];
    pending: PendingReimbursement[];
}
