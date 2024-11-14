export interface CryptoMovementAdd {
    date:  Date;
    movementType: string;
    commerceType: string;
    expenseAsset?: string;
    expenseAccount?: string;
    expenseAmount?: number;
    expenseQuote?: number;
    incomeAsset?: string;
    incomeAccount?: string;
    incomeAmount?: number;
    incomeQuote?: number;
}