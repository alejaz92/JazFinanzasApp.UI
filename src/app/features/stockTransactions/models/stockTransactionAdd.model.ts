export interface StockTransactionAdd {
    date:  Date;
    movementType: string;
    commerceType: string;
    assetType: string;
    expenseAsset?: string;
    expenseAccount?: string;
    expenseAmount?: number;
    expenseQuote?: number;
    incomeAsset?: string;
    incomeAccount?: string;
    incomeAmount?: number;
    incomeQuote?: number;
}