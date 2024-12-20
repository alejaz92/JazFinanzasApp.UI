export interface StockTransactionAdd {
    date:  Date;
    stockMovementType: string;
    commerceType: string;
    assetType: string;
    expenseAssetId?: string;
    expenseAccountId?: string;
    expenseQuantity?: number;
    expenseQuotePrice?: number;
    incomeAssetId?: string;
    incomeAccountId?: string;
    incomeQuantity?: number;
    incomeQuotePrice?: number;
    environment: string;
}