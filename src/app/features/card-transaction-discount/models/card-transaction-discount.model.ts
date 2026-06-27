export interface CardTransactionDiscountAdd {
  cardTransactionId: number;
  amount: number;
  accountId: number;
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
  notes?: string;
  installments: CardTransactionDiscountInstallment[];
}
