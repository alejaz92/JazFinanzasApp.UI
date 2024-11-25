export interface MovementAdd {
    incomeAccounId?: number | null;
    expenseAccountId?: number | null;
    assetId: number;
    date: Date;
    movementType: string;
    transactionClassId?: number | null;
    detail: string;
    amount: number;
    quotePrice: number;
}