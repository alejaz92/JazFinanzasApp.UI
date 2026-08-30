export interface TransactionClass {
    id: number;
    description: string;
    incExp: string;
    isSystem?: boolean;
    countsAsIncomeExpense: boolean;
    parentId: number | null;
}