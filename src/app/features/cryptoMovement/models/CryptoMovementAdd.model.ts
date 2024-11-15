export interface CryptoMovementAdd {
    environment: string;
    date:  Date;
    movementType: string;
    commerceType: string;
    expenseAssetId?: string;
    expenseAccountId?: string;
    expenseQuantity?: number;
    expenseQuotePrice?: number;
    incomeAssetId?: string;
    incomeAccountId?: string;
    incomeQuantity?: number;
    incomeQuotePrice?: number;
}