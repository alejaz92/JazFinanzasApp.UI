export interface StockTransactionAdd {
    date:  Date;
    stockMovementType: string;
    commerceType: string;
    assetType: string;
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
    environment: string;
}