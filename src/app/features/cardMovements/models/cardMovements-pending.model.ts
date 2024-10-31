export interface CardMovementPending {
    id: number;
    date: Date;
    card: string;
    movementClass: string;
    detail: string;
    installments: string;   
    asset: string;
    totalAmount: number;
    firstInstallment: Date;
    lastInstallment: string;
    installmentAmount: number;
}