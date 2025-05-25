export interface CurrencyExchange {
    id: number;
    date:  Date;
    expenseAsset?: string;
    expenseAccount?: string;
    expensePortfolio?: string;
    expenseAmount?: number;
    incomeAsset?: string;
    incomeAccount?: string;
    incomePortfolio?: string;
    incomeAmount?: number;
}