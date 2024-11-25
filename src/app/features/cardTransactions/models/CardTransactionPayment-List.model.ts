export interface CardTransactionPaymentList {
    date: string;
    transactionClassId: number;
    transactionClass: string;
    detail: string;
    assetId: number;
    asset: string;
    installment: string;
    installmentAmount: number;
    valueInPesos: number;
    pay: boolean | true;
  }