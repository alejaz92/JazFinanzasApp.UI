export interface CardMovementsAdd {
    date: Date;
    detail: string;
    cardId: number;
    movementClassId: number;
    assetId: number;
    totalAmount: number;
    installments: number;
    firstInstallment: string;
    lastInstallment?: string;
    repeat: string;    
}