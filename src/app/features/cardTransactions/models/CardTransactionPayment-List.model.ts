export interface CardTransactionPaymentList {
    cardTransactionId: number;
    date: string;
    cardId: number;
    card: string;
    transactionClassId: number;
    transactionClass: string;
    detail: string;
    assetId: number;
    asset: string;
    installment: string;
    installmentNumber: number;
    installmentAmount: number;
    valueInPesos: number;
    pay: boolean | true;
  }