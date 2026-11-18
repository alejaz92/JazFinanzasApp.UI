import { PurchaseDifference } from './purchase-difference.model';

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
    // Qué fue la diferencia entre el valor de la cuota y lo que se paga (plan-repartos-y-descuentos-faltantes.md, D5). Opcional.
    difference?: PurchaseDifference;
  }