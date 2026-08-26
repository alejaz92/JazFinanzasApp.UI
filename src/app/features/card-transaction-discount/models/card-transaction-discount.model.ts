// Dónde acreditó el banco el reintegro. Espeja CardTransactionDiscountCreditTarget del backend.
export type CreditTarget = 'ACCOUNT' | 'CARD';

export interface CardTransactionDiscountAdd {
  cardTransactionId: number;
  amount: number;
  creditTarget: CreditTarget;
  // Solo cuando creditTarget es ACCOUNT; con CARD no entra plata a ninguna cuenta.
  accountId: number | null;
  date: string;
  notes?: string;
}

export interface CardTransactionDiscountInstallment {
  installmentNumber: number;
  amount: number;
}

export interface CardTransactionDiscountDetail {
  id: number;
  cardTransactionId: number;
  amount: number;
  amountApplied: number;
  amountMaterialized: number;
  // Lo que todavía es saldo a favor en la tarjeta.
  pendingOnCard: number;
  creditTarget: CreditTarget;
  creditDate: string;
  notes?: string;
  installments: CardTransactionDiscountInstallment[];
}

export interface CardTransactionDiscountRescue {
  amount: number;
  accountId: number;
  date: string;
}

export interface CardPendingCreditItem {
  discountId: number;
  cardTransactionId: number;
  detail?: string;
  creditDate: string;
  pending: number;
}

export interface CardPendingCredit {
  cardId: number;
  totalPending: number;
  items: CardPendingCreditItem[];
}
