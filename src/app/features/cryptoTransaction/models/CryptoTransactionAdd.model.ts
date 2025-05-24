export interface CryptoTransactionAdd {
    environment: string;
    date:  Date;
    movementType: string;
    commerceType: string;
    expenseAssetId?: string;
    expenseAccountId?: string;
    expensePortfolioId?: string;
    expenseQuantity?: number;
    expenseQuotePrice?: number;
    incomeAssetId?: string;
    incomeAccountId?: string;
    incomePortfolioId?: string;
    incomeQuantity?: number;
    incomeQuotePrice?: number;
}