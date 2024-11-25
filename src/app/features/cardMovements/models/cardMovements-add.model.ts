export interface CardMovementsAdd {
    date: Date;
    detail: string;
    cardId: number;
    transactionClassId: number;
    assetId: number;
    totalAmount: number;
    installments: number;
    firstInstallment: string;
    lastInstallment?: string;
    repeat: string;    
}