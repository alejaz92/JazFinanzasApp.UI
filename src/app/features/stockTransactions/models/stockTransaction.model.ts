export interface StockTransaction {
    id: number;
    date:  Date;
    stockMovementType: string;
    commerceType: string;
    assetType: string;
    expenseAsset?: string;
    expenseAccount?: string;
    expensePortfolio?: string;
    expenseQuantity?: number;
    expenseQuotePrice?: number;
    incomeAsset?: string;
    incomeAccount?: string;
    incomePortfolio?: string;
    incomeQuantity?: number;
    incomeQuotePrice?: number;
}