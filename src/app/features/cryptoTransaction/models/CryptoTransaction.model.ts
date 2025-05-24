export interface CryptoTransaction {
    id: number;
    date:  Date;
    movementType: string;
    commerceType: string;
    expenseAsset?: string;
    expenseAccount?: string;
    expensePortfolio?: string;
    expenseAmount?: number;
    expenseQuote?: number;
    incomeAsset?: string;
    incomeAccount?: string;
    incomePortfolio?: string;
    incomeAmount?: number;
    incomeQuote?: number;
}