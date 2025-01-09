export interface CardTransactionPending {
    id: number;
    date: Date;
    card: string;
    transactionClass: string;
    detail: string;
    installments: string;   
    asset: string;
    assetSymbol: string;
    totalAmount: number;
    firstInstallment: Date;
    lastInstallment: string;
    installmentAmount: number;
}