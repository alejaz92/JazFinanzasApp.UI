// Contrato de api/RecurringExpense (plan-gastos-recurrentes.md, Fases 5 y 6). Los meses y las fechas viajan como "2026-11-01T00:00:00".

export type RecurringSource = 'CARD' | 'ACCOUNT';
export type RecurringFrequency = 'MONTHLY' | 'BIMONTHLY' | 'NONE';
export type RecurringMonthState = 'Paid' | 'Estimated' | 'NoCharge' | 'NotCharged' | 'Unpaid';
export type RecurringMonthMark = 'DEFERRED' | 'NO_CHARGE' | 'PENDING';

export interface RecurringExpenseListItem {
  id: number;
  name: string;
  transactionClassId: number;
  transactionClass: string;
  assetId: number;
  assetSymbol: string;
  source: RecurringSource;
  cardId: number | null;
  cardName: string | null;
  accountId: number | null;
  accountName: string | null;
  frequency: RecurringFrequency;
  startMonth: string;
  endMonth: string | null;
  isActive: boolean;
  // Lo último que costó, en su moneda: lo que se espera la próxima vez.
  expectedAmount: number;
  currentMonthState: RecurringMonthState | null;
  currentMonthAmount: number | null;
}

export interface RecurringExpensePayment {
  transactionId: number;
  // En una cuota de tarjeta, el mes del resumen que la trajo.
  date: string;
  chargedEarly: boolean;
  chargedLate: boolean;
  amount: number;
  nativeAmount: number;
  nativeAssetSymbol: string;
  converted: boolean;
  cardId: number | null;
  cardName: string | null;
  accountId: number | null;
  accountName: string | null;
  detail: string | null;
}

export interface RecurringExpenseMonth {
  month: string;
  state: RecurringMonthState;
  amount: number;
  isEstimate: boolean;
  converted: boolean;
  exceptionStatus: RecurringMonthMark | null;
  cardId: number | null;
  cardName: string | null;
  accountId: number | null;
  accountName: string | null;
  payments: RecurringExpensePayment[];
}

export interface RecurringExpenseDetail extends RecurringExpenseListItem {
  notes: string | null;
  hasPayments: boolean;
  // Del más viejo al más nuevo. Un mes que no está no se esperaba.
  months: RecurringExpenseMonth[];
}

export interface RecurringExpenseCreate {
  name: string;
  transactionClassId: number;
  assetId: number;
  source: RecurringSource;
  cardId: number | null;
  accountId: number | null;
  frequency: RecurringFrequency | null;
  startMonth: string;
  expectedAmount: number;
  notes: string | null;
}

export interface RecurringExpenseEdit {
  name: string;
  transactionClassId: number;
  assetId: number;
  frequency: RecurringFrequency | null;
  expectedAmount: number | null;
  notes: string | null;
}

export interface RecurringExpenseSourceChange {
  source: RecurringSource;
  cardId: number | null;
  accountId: number | null;
  frequency: RecurringFrequency | null;
  fromMonth: string | null;
}

export interface RecurringExpenseReactivate {
  month: string;
  source: RecurringSource;
  cardId: number | null;
  accountId: number | null;
  frequency: RecurringFrequency | null;
  expectedAmount: number | null;
}

export interface RecurringExpensePaymentRegister {
  month: string;
  date: string;
  amount: number;
  accountId: number | null;
  detail: string | null;
}

export interface RecurringPaymentCandidate {
  transactionId: number;
  date: string;
  amount: number;
  assetSymbol: string;
  detail: string | null;
}

export interface RecurringPurchaseCandidate {
  cardTransactionId: number;
  date: string;
  firstInstallment: string;
  cardName: string;
  detail: string | null;
  totalAmount: number;
  assetSymbol: string;
  installments: number;
  paidInstallments: number;
}
