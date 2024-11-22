export interface CurrencyExchange {
    id: number;
    date:  Date;
    expenseAsset?: string;
    expenseAccount?: string;
    expenseAmount?: number;
    incomeAsset?: string;
    incomeAccount?: string;
    incomeAmount?: number;
}