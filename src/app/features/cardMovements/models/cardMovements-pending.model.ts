export interface CardMovementPending {
    id: number;
    date: Date;
    card: string;
    transactionClass: string;
    detail: string;
    installments: string;   
    asset: string;
    totalAmount: number;
    firstInstallment: Date;
    lastInstallment: string;
    installmentAmount: number;
}