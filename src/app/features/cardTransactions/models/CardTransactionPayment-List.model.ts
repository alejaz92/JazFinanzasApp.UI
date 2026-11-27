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
    // El fijo o suscripción de la fila (plan-gastos-recurrentes.md, D5) y el mes al que corresponde el cobro.
    recurringExpenseId?: number | null;
    recurringMonth?: string | null;
    // Solo al consultar: la fila no se espera (ese mes ya se cobró por adelantado, o ya lo representa una compra suelta de la ficha) y viene
    // sin tildar.
    alreadyCharged?: boolean;
    coveredByPurchase?: boolean;
    // Solo al pagar un segundo cobro: es el del mes siguiente, o uno de más del mismo mes.
    advanceNext?: boolean;
    extra?: boolean;
  }

// Qué pasó con una suscripción esperada que no vino en el resumen.
export type CardStatementOutcomeKind = 'DEFERRED' | 'NO_CHARGE' | 'CANCELLED' | 'PENDING';

export interface CardStatementOutcome {
    recurringExpenseId: number;
    month: string | null;
    outcome: CardStatementOutcomeKind;
}