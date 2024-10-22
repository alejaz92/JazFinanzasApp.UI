export interface MovementAdd {
    incomeAccounId?: number | null;
    expenseAccountId?: number | null;
    assetId: number;
    date: Date;
    movementType: string;
    movementClassId?: number | null;
    detail: string;
    amount: number;
    quotePrice: number;
}