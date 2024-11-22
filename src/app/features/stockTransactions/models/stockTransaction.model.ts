export interface StockTransaction {
    id: number;
    date:  Date;
    stockTransactionType: string;
    commerceType: string;
    assetType: string;
    expenseAsset?: string;
    expenseAccount?: string;
    expenseQuantity?: number;
    expenseQuotePrice?: number;
    incomeAsset?: string;
    incomeAccount?: string;
    incomeQuantity?: number;
    incomeQuotePrice?: number;
}