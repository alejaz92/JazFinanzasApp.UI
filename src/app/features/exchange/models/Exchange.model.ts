export interface Exchange {
    id: number;
    date:  Date;
    expenseAsset?: string;
    expenseAccount?: string;
    expenseAmount?: number;
    incomeAsset?: string;
    incomeAccount?: string;
    incomeAmount?: number;
}