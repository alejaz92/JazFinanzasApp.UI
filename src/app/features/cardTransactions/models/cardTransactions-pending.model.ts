export interface CardTransactionPending {
    id: number;
    date: Date;
    card: string;
    transactionClass: string;
    detail: string;
    installments: string;   
    asset: string;
    assetSymbol: string;
    totalAmount: number;
    firstInstallment: Date;
    lastInstallment: string;
    installmentAmount: number;
    tripId?: number | null;
    tripName?: string;
    // El fijo o suscripción de la compra, si tiene (plan-gastos-recurrentes.md, D8).
    recurringExpenseId?: number | null;
}