export interface TransactionClassAddRequest {
    description: string;
    incExp: string;
    countsAsIncomeExpense: boolean;
    parentId: number | null;
}