export interface CurrencyExchangeAdd {
    date:  Date;
    expenseAssetId: string;
    expenseAccountId: string;
    expenseAmount: number;
    incomeAssetId: string;
    incomeAccountId: string;
    incomeAmount: number;
}